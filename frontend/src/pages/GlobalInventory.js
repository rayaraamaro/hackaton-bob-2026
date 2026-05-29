import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryAPI } from '../services/api';

/**
 * Global Inventory Page
 * Shows aggregated inventory across all stores
 */
function GlobalInventory() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [allInventoryItems, setAllInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchGlobalInventory();
    fetchAllInventoryItems();
  }, []);

  const fetchGlobalInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getGlobalInventory();
      setInventory(response.data.data);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar inventário global');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllInventoryItems = async () => {
    try {
      const response = await inventoryAPI.getAllInventory();
      setAllInventoryItems(response.data.data);
    } catch (err) {
      console.error('Erro ao carregar itens de inventário:', err);
    }
  };

  const handleRemoveQuantity = async (inventoryId, productName, storeName, currentQuantity) => {
    const quantity = prompt(`Quantas unidades de ${productName} deseja remover da loja ${storeName}?\n\nQuantidade atual: ${currentQuantity}`, '1');
    
    if (quantity === null) {
      return; // User cancelled
    }

    const quantityNum = parseInt(quantity);
    
    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert('Por favor, insira uma quantidade válida maior que zero.');
      return;
    }

    if (quantityNum > currentQuantity) {
      alert(`Quantidade inválida. Você só pode remover até ${currentQuantity} unidades.`);
      return;
    }

    try {
      await inventoryAPI.updateInventory(inventoryId, {
        quantity: quantityNum,
        operation: 'remove'
      });
      await fetchGlobalInventory();
      await fetchAllInventoryItems();
      alert(`${quantityNum} unidade(s) removida(s) com sucesso!`);
    } catch (err) {
      alert('Erro ao remover quantidade: ' + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

  const handleDeleteItem = async (inventoryId, productName, storeName) => {
    if (!window.confirm(`Tem certeza que deseja remover COMPLETAMENTE ${productName} da loja ${storeName}?`)) {
      return;
    }

    try {
      await inventoryAPI.deleteInventoryItem(inventoryId);
      await fetchGlobalInventory();
      await fetchAllInventoryItems();
      alert('Item removido completamente com sucesso!');
    } catch (err) {
      alert('Erro ao remover item: ' + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const categories = ['all', 'bikes', 'parts', 'accessories'];

  if (loading) return <div className="loading">Carregando inventário global...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#667eea' }}>
          🌐 Visão Geral do Estoque Global
        </h1>
        <button
          onClick={() => navigate('/add-inventory')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ➕ Adicionar Item
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total de Produtos</h3>
          <div className="value">{inventory.length}</div>
        </div>
        <div className="stat-card">
          <h3>Total de Unidades</h3>
          <div className="value">
            {inventory.reduce((sum, item) => sum + item.totalQuantity, 0)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Valor Total</h3>
          <div className="value">
            R$ {inventory.reduce((sum, item) => sum + parseFloat(item.totalValue), 0).toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <h3>Média por Loja</h3>
          <div className="value">
            {inventory.length > 0
              ? Math.round(inventory.reduce((sum, item) => sum + item.totalQuantity, 0) / inventory[0].storeCount)
              : 0}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ fontWeight: 'bold' }}>Filtrar por Categoria:</label>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={filter === cat ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
            >
              {cat === 'all' ? 'Todos' : cat === 'bikes' ? 'Bicicletas' : cat === 'parts' ? 'Peças' : 'Acessórios'}
            </button>
          ))}
        </div>

        {/* Inventory Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>SKU</th>
                <th>Quantidade Total</th>
                <th>Preço</th>
                <th>Valor Total</th>
                <th>Lojas</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <React.Fragment key={item.productId}>
                  <tr>
                    <td><strong>{item.productName}</strong></td>
                    <td>
                      <span className="badge badge-success">
                        {item.category === 'bikes' ? 'Bicicletas' : item.category === 'parts' ? 'Peças' : 'Acessórios'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#666' }}>
                      {item.sku}
                    </td>
                    <td><strong>{item.totalQuantity}</strong></td>
                    <td>R$ {item.price}</td>
                    <td><strong>R$ {item.totalValue}</strong></td>
                    <td>{item.storeCount} lojas</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                        onClick={() => {
                          const row = document.getElementById(`details-${item.productId}`);
                          row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                  <tr
                    id={`details-${item.productId}`}
                    style={{ display: 'none', background: '#f8f9fa' }}
                  >
                    <td colSpan="8">
                      <div style={{ padding: '1rem' }}>
                        <h4 style={{ marginBottom: '0.5rem', color: '#667eea' }}>
                          Distribuição por Loja
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                          {item.stores.map((store, idx) => {
                            const inventoryItem = allInventoryItems.find(
                              inv => inv.productId === item.productId && inv.storeId === store.storeId
                            );
                            
                            return (
                              <div
                                key={idx}
                                style={{
                                  padding: '0.8rem',
                                  background: 'white',
                                  borderRadius: '6px',
                                  border: '1px solid #e9ecef',
                                  position: 'relative'
                                }}
                              >
                                <p style={{ fontWeight: 'bold', marginBottom: '0.3rem' }}>
                                  {store.storeName}
                                </p>
                                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                  Quantidade: <strong>{store.quantity}</strong>
                                </p>
                                {store.needsRestock && (
                                  <span className="badge badge-danger" style={{ marginTop: '0.3rem', display: 'block', marginBottom: '0.5rem' }}>
                                    Estoque Baixo
                                  </span>
                                )}
                                {inventoryItem && (
                                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <button
                                      onClick={() => handleRemoveQuantity(inventoryItem.id, item.productName, store.storeName, store.quantity)}
                                      className="btn btn-secondary"
                                      style={{
                                        fontSize: '0.75rem',
                                        padding: '0.3rem 0.6rem',
                                        background: '#ffc107',
                                        color: '#000',
                                        border: 'none',
                                        flex: 1
                                      }}
                                    >
                                      ➖ Remover Qtd
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(inventoryItem.id, item.productName, store.storeName)}
                                      className="btn btn-secondary"
                                      style={{
                                        fontSize: '0.75rem',
                                        padding: '0.3rem 0.6rem',
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        flex: 1
                                      }}
                                    >
                                      🗑️ Remover Tudo
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="empty-state">
            <p>Nenhum produto encontrado nesta categoria</p>
          </div>
        )}
      </div>

      <button
        onClick={fetchGlobalInventory}
        className="btn btn-primary"
        style={{ marginTop: '1rem' }}
      >
        🔄 Atualizar Dados
      </button>
    </div>
  );
}

export default GlobalInventory;

// Made with Bob
