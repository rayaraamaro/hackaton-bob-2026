/**
 * AI Service
 * Implements AI-powered features for inventory management:
 * - Demand Forecasting
 * - Smart Restocking Suggestions
 * - Stock Redistribution
 * - Insights Generation
 */

const dynamodbService = require('./dynamodbService');

class AIService {
  /**
   * Predict demand for a product based on historical sales
   * Uses simple moving average and trend analysis
   */
  static forecastDemand(inventoryItem, daysAhead = 7) {
    const salesHistory = inventoryItem.salesHistory;
    
    if (salesHistory.length === 0) {
      return { predictedDemand: 0, confidence: 'low' };
    }
    
    // Calculate average daily sales
    const totalSales = salesHistory.reduce((sum, record) => sum + record.quantity, 0);
    const avgDailySales = totalSales / salesHistory.length;
    
    // Calculate trend (recent vs older sales)
    const recentDays = 7;
    const recentSales = salesHistory.slice(-recentDays);
    const recentAvg = recentSales.length > 0 
      ? recentSales.reduce((sum, r) => sum + r.quantity, 0) / recentSales.length 
      : avgDailySales;
    
    // Trend factor: if recent sales > average, trend is positive
    const trendFactor = recentAvg / (avgDailySales || 1);
    
    // Predict demand with trend adjustment
    const predictedDemand = Math.ceil(avgDailySales * daysAhead * trendFactor);
    
    // Confidence based on data availability
    let confidence = 'low';
    if (salesHistory.length > 20) confidence = 'high';
    else if (salesHistory.length > 10) confidence = 'medium';
    
    return {
      predictedDemand,
      avgDailySales: avgDailySales.toFixed(2),
      trend: trendFactor > 1.1 ? 'increasing' : trendFactor < 0.9 ? 'decreasing' : 'stable',
      confidence
    };
  }
  
  /**
   * Generate restocking suggestions for all stores
   */
  static async getRestockingSuggestions() {
    const suggestions = [];
    
    const inventory = await dynamodbService.getAllInventory();
    const stores = await dynamodbService.getAllStores();
    const products = await dynamodbService.getAllProducts();
    
    inventory.forEach(item => {
      const store = stores.find(s => s.id === item.storeId);
      const product = products.find(p => p.id === item.productId);
      
      if (!store || !product) return;
      
      // Get demand forecast
      const forecast = this.forecastDemand(item, 14); // 2 weeks ahead
      
      // Calculate suggested restock quantity
      const currentStock = item.quantity;
      const predictedDemand = forecast.predictedDemand;
      const safetyStock = item.reorderPoint * 2; // Buffer stock
      
      const suggestedQuantity = Math.max(0, predictedDemand + safetyStock - currentStock);
      
      // Only suggest if quantity is significant or stock is low
      if (suggestedQuantity > 0 || item.quantity <= item.reorderPoint) {
        suggestions.push({
          storeId: store.id,
          storeName: store.name,
          productId: product.id,
          productName: product.name,
          category: product.category,
          currentStock,
          reorderPoint: item.reorderPoint,
          predictedDemand: forecast.predictedDemand,
          suggestedQuantity: Math.ceil(suggestedQuantity),
          priority: item.quantity < item.reorderPoint ? 'high' : 
                   item.quantity < item.reorderPoint * 2 ? 'medium' : 'low',
          forecast
        });
      }
    });
    
    // Sort by priority (high first) and then by suggested quantity
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.suggestedQuantity - a.suggestedQuantity;
    });
    
    return suggestions;
  }
  
  /**
   * Identify stock imbalances and suggest redistributions
   */
  static async getRedistributionSuggestions() {
    const suggestions = [];
    
    const inventory = await dynamodbService.getAllInventory();
    const stores = await dynamodbService.getAllStores();
    const products = await dynamodbService.getAllProducts();
    
    // Group inventory by product
    const productGroups = {};
    inventory.forEach(item => {
      if (!productGroups[item.productId]) {
        productGroups[item.productId] = [];
      }
      productGroups[item.productId].push(item);
    });
    
    // Analyze each product across stores
    Object.keys(productGroups).forEach(productId => {
      const items = productGroups[productId];
      const product = products.find(p => p.id === productId);
      
      if (!product || items.length < 2) return;
      
      // Find stores with excess and deficit
      const storesWithExcess = [];
      const storesWithDeficit = [];
      
      items.forEach(item => {
        const store = stores.find(s => s.id === item.storeId);
        if (!store || store.type !== 'local') return;
        
        const forecast = this.forecastDemand(item, 7);
        const excessThreshold = item.reorderPoint * 3;
        
        if (item.quantity > excessThreshold && forecast.trend !== 'increasing') {
          storesWithExcess.push({
            store,
            item,
            excess: item.quantity - excessThreshold
          });
        }
        
        if (item.quantity < item.reorderPoint * 1.5) {
          storesWithDeficit.push({
            store,
            item,
            deficit: (item.reorderPoint * 2) - item.quantity
          });
        }
      });
      
      // Match excess with deficit
      storesWithExcess.forEach(excess => {
        storesWithDeficit.forEach(deficit => {
          if (excess.store.id !== deficit.store.id) {
            const transferQuantity = Math.min(
              Math.floor(excess.excess * 0.7), // Don't transfer all excess
              deficit.deficit
            );
            
            if (transferQuantity > 0) {
              suggestions.push({
                productId: product.id,
                productName: product.name,
                fromStoreId: excess.store.id,
                fromStoreName: excess.store.name,
                toStoreId: deficit.store.id,
                toStoreName: deficit.store.name,
                quantity: transferQuantity,
                reason: `${excess.store.name} has excess stock (${excess.item.quantity}), ` +
                       `${deficit.store.name} is running low (${deficit.item.quantity})`
              });
            }
          }
        });
      });
    });
    
    return suggestions;
  }
  
  /**
   * Generate comprehensive insights dashboard data
   */
  static async getInsights() {
    const inventory = await dynamodbService.getAllInventory();
    const stores = await dynamodbService.getAllStores();
    const products = await dynamodbService.getAllProducts();
    
    // Top selling products (based on sales history)
    const productSales = {};
    inventory.forEach(item => {
      const totalSales = item.salesHistory.reduce((sum, r) => sum + r.quantity, 0);
      if (!productSales[item.productId]) {
        productSales[item.productId] = 0;
      }
      productSales[item.productId] += totalSales;
    });
    
    const topSelling = Object.entries(productSales)
      .map(([productId, sales]) => {
        const product = products.find(p => p.id === productId);
        return { product, sales };
      })
      .filter(item => item.product)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)
      .map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        totalSales: item.sales,
        revenue: (item.sales * item.product.price).toFixed(2)
      }));
    
    // Slow-moving inventory (low sales, high stock)
    const slowMoving = inventory
      .map(item => {
        const product = products.find(p => p.id === item.productId);
        const store = stores.find(s => s.id === item.storeId);
        const totalSales = item.salesHistory.reduce((sum, r) => sum + r.quantity, 0);
        const avgDailySales = totalSales / 30;
        
        return {
          item,
          product,
          store,
          avgDailySales,
          daysOfStock: avgDailySales > 0 ? item.quantity / avgDailySales : 999
        };
      })
      .filter(x => x.product && x.store && x.daysOfStock > 60)
      .sort((a, b) => b.daysOfStock - a.daysOfStock)
      .slice(0, 10)
      .map(x => ({
        productName: x.product.name,
        storeName: x.store.name,
        quantity: x.item.quantity,
        daysOfStock: Math.round(x.daysOfStock),
        avgDailySales: x.avgDailySales.toFixed(2)
      }));
    
    // Stock imbalances across stores
    const imbalances = (await this.getRedistributionSuggestions()).slice(0, 5);
    
    // Low stock alerts
    const lowStockAlerts = inventory
      .filter(item => item.quantity <= item.reorderPoint)
      .map(item => {
        const product = products.find(p => p.id === item.productId);
        const store = stores.find(s => s.id === item.storeId);
        return {
          productName: product?.name,
          storeName: store?.name,
          currentStock: item.quantity,
          reorderPoint: item.reorderPoint
        };
      })
      .slice(0, 10);
    
    // Overall statistics
    const totalProducts = products.length;
    const totalStores = stores.filter(s => s.type === 'local').length;
    const totalInventoryValue = inventory.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    
    const lowStockCount = inventory.filter(item => item.quantity <= item.reorderPoint).length;
    
    return {
      summary: {
        totalProducts,
        totalStores,
        totalInventoryValue: totalInventoryValue.toFixed(2),
        lowStockCount,
        totalInventoryItems: inventory.length
      },
      topSelling,
      slowMoving,
      imbalances,
      lowStockAlerts
    };
  }
  
  /**
   * AI Assistant - Answer natural language queries
   */
  static async askAssistant(query) {
    const lowerQuery = query.toLowerCase();
    
    const inventory = await dynamodbService.getAllInventory();
    const stores = await dynamodbService.getAllStores();
    const products = await dynamodbService.getAllProducts();
    
    // Low stock queries
    if (lowerQuery.includes('estoque baixo') || lowerQuery.includes('low stock') ||
        lowerQuery.includes('running low') || lowerQuery.includes('acabando')) {
      const lowStock = inventory
        .filter(item => item.quantity <= item.reorderPoint)
        .map(item => {
          const product = products.find(p => p.id === item.productId);
          const store = stores.find(s => s.id === item.storeId);
          return `📦 ${product?.name} na ${store?.name}: ${item.quantity} unidades (reabastecer em ${item.reorderPoint})`;
        })
        .slice(0, 5);
      
      return {
        answer: lowStock.length > 0
          ? `🔴 Encontrei ${lowStock.length} produtos com estoque baixo:\n\n${lowStock.join('\n')}`
          : '✅ Nenhum produto está com estoque baixo no momento.',
        data: lowStock
      };
    }
    
    // Restock queries
    if (lowerQuery.includes('restock') || lowerQuery.includes('order') ||
        lowerQuery.includes('repor') || lowerQuery.includes('reabastecer') ||
        lowerQuery.includes('comprar')) {
      const suggestions = await this.getRestockingSuggestions();
      const topSuggestions = suggestions.slice(0, 5);
      const response = topSuggestions.map(s =>
        `📋 ${s.productName} na ${s.storeName}: Pedir ${s.suggestedQuantity} unidades (Prioridade: ${s.priority})`
      );
      
      return {
        answer: response.length > 0
          ? `🛒 Principais sugestões de reabastecimento:\n\n${response.join('\n')}`
          : '✅ Nenhum reabastecimento necessário no momento.',
        data: topSuggestions
      };
    }
    
    // Transfer/redistribution queries
    if (lowerQuery.includes('transfer') || lowerQuery.includes('redistribute') ||
        lowerQuery.includes('transferir') || lowerQuery.includes('redistribuir')) {
      const suggestions = await this.getRedistributionSuggestions();
      const topSuggestions = suggestions.slice(0, 3);
      const response = topSuggestions.map(s =>
        `🔄 Transferir ${s.quantity} unidades de ${s.productName} de ${s.fromStoreName} para ${s.toStoreName}`
      );
      
      return {
        answer: response.length > 0
          ? `📦 Transferências sugeridas:\n\n${response.join('\n')}`
          : '✅ Nenhuma transferência recomendada no momento.',
        data: topSuggestions
      };
    }
    
    // Top selling queries
    if (lowerQuery.includes('top selling') || lowerQuery.includes('best seller') ||
        lowerQuery.includes('mais vendidos') || lowerQuery.includes('vendas')) {
      const insights = await this.getInsights();
      const response = insights.topSelling.slice(0, 5).map(p =>
        `🏆 ${p.productName}: ${p.totalSales} unidades vendidas ($${p.revenue} em receita)`
      );
      
      return {
        answer: `⭐ Produtos mais vendidos:\n\n${response.join('\n')}`,
        data: insights.topSelling
      };
    }
    
    // Bicycle/bike count queries
    if (lowerQuery.includes('bicicleta') || lowerQuery.includes('bike') ||
        lowerQuery.includes('quantas')) {
      const bikeProducts = products.filter(p =>
        p.category === 'Bikes' || p.name.toLowerCase().includes('bike') ||
        p.name.toLowerCase().includes('bicicleta')
      );
      const bikeInventory = inventory.filter(item =>
        bikeProducts.some(p => p.id === item.productId)
      );
      const totalBikes = bikeInventory.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        answer: `🚴 Temos ${totalBikes} bicicletas no estoque total, distribuídas em ${bikeInventory.length} itens diferentes.`,
        data: { totalBikes, items: bikeInventory.length }
      };
    }
    
    // Store-specific queries
    const storeMatch = stores.find(s => lowerQuery.includes(s.name.toLowerCase()));
    if (storeMatch) {
      const storeInventory = inventory.filter(item => item.storeId === storeMatch.id);
      const totalValue = storeInventory.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product ? product.price * item.quantity : 0);
      }, 0);
      const lowStockCount = storeInventory.filter(item => item.quantity <= item.reorderPoint).length;
      
      return {
        answer: `🏪 ${storeMatch.name}:\n` +
               `📦 ${storeInventory.length} produtos em estoque\n` +
               `💰 Valor total: $${totalValue.toFixed(2)}\n` +
               `${lowStockCount > 0 ? `⚠️ ${lowStockCount} itens com estoque baixo` : '✅ Todos os itens com estoque adequado'}`,
        data: { store: storeMatch, inventoryCount: storeInventory.length, totalValue, lowStockCount }
      };
    }
    
    // Default response with general insights
    const lowStockCount = inventory.filter(item => item.quantity <= item.reorderPoint).length;
    
    return {
      answer: `🤖 Olá! Posso ajudar você com:\n\n` +
             `📊 Análises disponíveis:\n` +
             `• Alertas de estoque baixo (${lowStockCount} itens precisam de atenção)\n` +
             `• Sugestões de reabastecimento\n` +
             `• Transferências de estoque entre lojas\n` +
             `• Produtos mais vendidos\n` +
             `• Informações específicas de lojas\n\n` +
             `💡 Exemplos de perguntas:\n` +
             `• "Quantas bicicletas temos no estoque?"\n` +
             `• "Qual loja tem estoque baixo?"\n` +
             `• "O que devo repor esta semana?"\n` +
             `• "Mostre os produtos mais vendidos"`,
      data: {
        lowStockCount,
        totalStores: stores.length,
        totalProducts: products.length,
        totalInventoryItems: inventory.length
      }
    };
  }
}

module.exports = AIService;

// Made with Bob
