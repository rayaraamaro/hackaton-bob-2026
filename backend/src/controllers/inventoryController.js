const dynamodbService = require('../services/dynamodbService');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');

/**
 * Inventory Controller
 * Handles inventory-related API requests with DynamoDB
 */

class InventoryController {
  /**
   * Get all inventory items
   */
  static async getAllInventory(req, res) {
    try {
      const { storeId, productId, category } = req.query;
      
      let inventory = await dynamodbService.getAllInventory();
      const stores = await dynamodbService.getAllStores();
      const products = await dynamodbService.getAllProducts();
      
      // Filter by store
      if (storeId) {
        inventory = inventory.filter(item => item.storeId === storeId);
      }
      
      // Filter by product
      if (productId) {
        inventory = inventory.filter(item => item.productId === productId);
      }
      
      // Filter by category
      if (category) {
        inventory = inventory.filter(item => {
          const product = products.find(p => p.id === item.productId);
          return product && product.category === category;
        });
      }
      
      // Enrich with store and product details
      const enrichedInventory = inventory.map(item => {
        const store = stores.find(s => s.id === item.storeId);
        const product = products.find(p => p.id === item.productId);
        
        return {
          ...item,
          storeName: store?.name,
          storeLocation: store?.location,
          productName: product?.name,
          productCategory: product?.category,
          productPrice: product?.price,
          totalValue: product ? (product.price * item.quantity).toFixed(2) : 0,
          needsRestock: item.quantity <= item.reorderPoint
        };
      });
      
      res.json({
        success: true,
        count: enrichedInventory.length,
        data: enrichedInventory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get inventory for a specific store
   */
  static async getStoreInventory(req, res) {
    try {
      const { storeId } = req.params;
      const store = await dynamodbService.getStoreById(storeId);
      
      if (!store) {
        return res.status(404).json({
          success: false,
          error: 'Store not found'
        });
      }
      
      const inventory = await dynamodbService.getInventoryByStore(storeId);
      const products = await dynamodbService.getAllProducts();
      
      const enrichedInventory = inventory.map(item => {
        const product = products.find(p => p.id === item.productId);
        
        return {
          ...item,
          productName: product?.name,
          productCategory: product?.category,
          productPrice: product?.price,
          productSku: product?.sku,
          totalValue: product ? (product.price * item.quantity).toFixed(2) : 0,
          needsRestock: item.quantity <= item.reorderPoint
        };
      });
      
      res.json({
        success: true,
        store: {
          id: store.id,
          name: store.name,
          location: store.location
        },
        count: enrichedInventory.length,
        data: enrichedInventory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Update inventory quantity (stock in/out)
   */
  static async updateInventory(req, res) {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body;
      
      const inventory = await dynamodbService.getAllInventory();
      const item = inventory.find(i => i.id === id);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Inventory item not found'
        });
      }
      
      let newQuantity = item.quantity;
      
      if (operation === 'add') {
        newQuantity += quantity;
      } else if (operation === 'remove') {
        if (item.quantity < quantity) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient stock'
          });
        }
        newQuantity -= quantity;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid operation. Use "add" or "remove"'
        });
      }
      
      const updatedItem = await dynamodbService.updateInventoryItem(id, { quantity: newQuantity });
      
      const products = await dynamodbService.getAllProducts();
      const stores = await dynamodbService.getAllStores();
      const product = products.find(p => p.id === item.productId);
      const store = stores.find(s => s.id === item.storeId);
      
      res.json({
        success: true,
        message: `Inventory updated successfully`,
        data: {
          ...updatedItem,
          productName: product?.name,
          storeName: store?.name
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Transfer stock between stores
   */
  static async transferStock(req, res) {
    try {
      const { productId, fromStoreId, toStoreId, quantity } = req.body;
      
      if (!productId || !fromStoreId || !toStoreId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid transfer parameters'
        });
      }
      
      const inventory = await dynamodbService.getAllInventory();
      const fromItem = inventory.find(i => i.storeId === fromStoreId && i.productId === productId);
      const toItem = inventory.find(i => i.storeId === toStoreId && i.productId === productId);
      
      if (!fromItem) {
        return res.status(404).json({
          success: false,
          error: 'Source inventory not found'
        });
      }
      
      if (!toItem) {
        return res.status(404).json({
          success: false,
          error: 'Destination inventory not found'
        });
      }
      
      if (fromItem.quantity < quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock. Available: ${fromItem.quantity}`
        });
      }
      
      // Update both items
      await dynamodbService.updateInventoryItem(fromItem.id, { 
        quantity: fromItem.quantity - quantity 
      });
      await dynamodbService.updateInventoryItem(toItem.id, { 
        quantity: toItem.quantity + quantity 
      });
      
      const products = await dynamodbService.getAllProducts();
      const stores = await dynamodbService.getAllStores();
      const product = products.find(p => p.id === productId);
      const fromStore = stores.find(s => s.id === fromStoreId);
      const toStore = stores.find(s => s.id === toStoreId);
      
      res.json({
        success: true,
        message: `Transferred ${quantity} units of ${product?.name} from ${fromStore?.name} to ${toStore?.name}`,
        data: {
          productName: product?.name,
          fromStore: {
            name: fromStore?.name,
            remainingStock: fromItem.quantity - quantity
          },
          toStore: {
            name: toStore?.name,
            newStock: toItem.quantity + quantity
          },
          quantityTransferred: quantity
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get global inventory overview
   */
  static async getGlobalInventory(req, res) {
    try {
      const inventory = await dynamodbService.getAllInventory();
      const products = await dynamodbService.getAllProducts();
      const stores = await dynamodbService.getAllStores();
      
      const productAggregation = {};
      
      inventory.forEach(item => {
        if (!productAggregation[item.productId]) {
          productAggregation[item.productId] = {
            totalQuantity: 0,
            stores: []
          };
        }
        
        productAggregation[item.productId].totalQuantity += item.quantity;
        
        const store = stores.find(s => s.id === item.storeId);
        productAggregation[item.productId].stores.push({
          storeId: item.storeId,
          storeName: store?.name,
          quantity: item.quantity,
          needsRestock: item.quantity <= item.reorderPoint
        });
      });
      
      const globalInventory = Object.keys(productAggregation).map(productId => {
        const product = products.find(p => p.id === productId);
        const data = productAggregation[productId];
        
        return {
          productId,
          productName: product?.name,
          category: product?.category,
          price: product?.price,
          sku: product?.sku,
          totalQuantity: data.totalQuantity,
          totalValue: product ? (product.price * data.totalQuantity).toFixed(2) : 0,
          storeCount: data.stores.length,
          stores: data.stores
        };
      });
      
      res.json({
        success: true,
        count: globalInventory.length,
        data: globalInventory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create new inventory item
   */
  static async createInventoryItem(req, res) {
    try {
      const {
        productName,
        sku,
        category,
        price,
        quantity,
        storeId,
        minStockLevel,
        description
      } = req.body;

      if (!productName || !sku || !category || !price || !quantity || !storeId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const store = await dynamodbService.getStoreById(storeId);
      if (!store) {
        return res.status(404).json({
          success: false,
          error: 'Store not found'
        });
      }

      const products = await dynamodbService.getAllProducts();
      let product = products.find(p => p.sku === sku);
      
      if (product) {
        const inventory = await dynamodbService.getInventoryByStore(storeId);
        const existingInventory = inventory.find(i => i.productId === product.id);
        
        if (existingInventory) {
          const addedQuantity = parseInt(quantity);
          const newQuantity = existingInventory.quantity + addedQuantity;
          
          await dynamodbService.updateInventoryItem(existingInventory.id, { 
            quantity: newQuantity 
          });
          
          return res.status(200).json({
            success: true,
            message: `Added ${addedQuantity} units to existing inventory`,
            data: {
              inventoryItem: {
                ...existingInventory,
                quantity: newQuantity,
                productName: product.name,
                productCategory: product.category,
                productPrice: product.price,
                productSku: product.sku,
                storeName: store.name,
                storeLocation: store.location,
                totalValue: (product.price * newQuantity).toFixed(2),
                addedQuantity: addedQuantity,
                previousQuantity: existingInventory.quantity
              },
              product: product
            }
          });
        }
      } else {
        product = new Product(productName, category, parseFloat(price), sku);
        if (description) {
          product.description = description;
        }
        await dynamodbService.createProduct(product);
      }

      const reorderPoint = minStockLevel || 10;
      const newInventoryItem = new InventoryItem(
        storeId,
        product.id,
        parseInt(quantity),
        reorderPoint
      );

      await dynamodbService.createInventoryItem(newInventoryItem);

      res.status(201).json({
        success: true,
        message: 'Inventory item created successfully',
        data: {
          inventoryItem: {
            ...newInventoryItem,
            productName: product.name,
            productCategory: product.category,
            productPrice: product.price,
            productSku: product.sku,
            storeName: store.name,
            storeLocation: store.location,
            totalValue: (product.price * newInventoryItem.quantity).toFixed(2)
          },
          product: product
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete inventory item
   */
  static async deleteInventoryItem(req, res) {
    try {
      const { id } = req.params;
      
      const inventory = await dynamodbService.getAllInventory();
      const item = inventory.find(i => i.id === id);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Inventory item not found'
        });
      }
      
      const products = await dynamodbService.getAllProducts();
      const stores = await dynamodbService.getAllStores();
      const product = products.find(p => p.id === item.productId);
      const store = stores.find(s => s.id === item.storeId);
      
      await dynamodbService.deleteInventoryItem(id);
      
      res.json({
        success: true,
        message: `Removed ${product?.name} from ${store?.name}`,
        data: {
          deletedItem: {
            id: item.id,
            productName: product?.name,
            storeName: store?.name,
            quantity: item.quantity
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = InventoryController;
