import React, { useState, useEffect } from 'react';
import { aiAPI } from '../services/api';

/**
 * Dashboard Page
 * Shows AI-powered insights and analytics
 */
function Dashboard() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await aiAPI.getInsights();
      setInsights(response.data.data);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar insights');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Carregando insights...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!insights) return null;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem', color: '#667eea' }}>
        📊 Painel de Insights com IA
      </h1>

      {/* Summary Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total de Produtos</h3>
          <div className="value">{insights.summary.totalProducts}</div>
        </div>
        <div className="stat-card">
          <h3>Total de Lojas</h3>
          <div className="value">{insights.summary.totalStores}</div>
        </div>
        <div className="stat-card">
          <h3>Valor do Estoque</h3>
          <div className="value">R$ {insights.summary.totalInventoryValue}</div>
        </div>
        <div className="stat-card">
          <h3>Alertas de Estoque Baixo</h3>
          <div className="value">{insights.summary.lowStockCount}</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Top Selling Products */}
        <div className="card">
          <h2>🏆 Produtos Mais Vendidos</h2>
          {insights.topSelling.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Vendas</th>
                    <th>Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.topSelling.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>
                        <span className="badge badge-success">
                          {item.category}
                        </span>
                      </td>
                      <td>{item.totalSales} unidades</td>
                      <td>R$ {item.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Nenhum dado de vendas disponível</p>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <h2>⚠️ Alertas de Estoque Baixo</h2>
          {insights.lowStockAlerts.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Loja</th>
                    <th>Estoque</th>
                    <th>Ponto de Reposição</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.lowStockAlerts.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>{item.storeName}</td>
                      <td>
                        <span className="badge badge-danger">
                          {item.currentStock}
                        </span>
                      </td>
                      <td>{item.reorderPoint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#28a745' }}>✓ Todos os produtos estão bem abastecidos!</p>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* Slow Moving Inventory */}
        <div className="card">
          <h2>🐌 Estoque de Baixa Rotatividade</h2>
          {insights.slowMoving.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Loja</th>
                    <th>Quantidade</th>
                    <th>Dias de Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.slowMoving.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>{item.storeName}</td>
                      <td>{item.quantity}</td>
                      <td>
                        <span className="badge badge-warning">
                          {item.daysOfStock} dias
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Nenhum estoque de baixa rotatividade detectado</p>
          )}
        </div>

        {/* Stock Redistribution Suggestions */}
        <div className="card">
          <h2>🔄 Transferências de Estoque Sugeridas</h2>
          {insights.imbalances.length > 0 ? (
            <div>
              {insights.imbalances.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}
                >
                  <h4 style={{ marginBottom: '0.5rem', color: '#667eea' }}>
                    {item.productName}
                  </h4>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Transferir <strong>{item.quantity} unidades</strong>
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#666' }}>
                    De: <strong>{item.fromStoreName}</strong> →
                    Para: <strong>{item.toStoreName}</strong>
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#28a745' }}>
              ✓ O estoque está bem equilibrado entre as lojas!
            </p>
          )}
        </div>
      </div>

      <button
        onClick={fetchInsights}
        className="btn btn-primary"
        style={{ marginTop: '1rem' }}
      >
        🔄 Atualizar Insights
      </button>
    </div>
  );
}

export default Dashboard;

// Made with Bob
