import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAPI, inventoryAPI } from '../services/api';

/**
 * Stores Page
 * View all stores and their inventory details
 */
function Stores() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeInventory, setStoreInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await storeAPI.getAllStores();
      setStores(response.data.data);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar lojas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelect = async (store) => {
    setSelectedStore(store);
    try {
      const response = await inventoryAPI.getStoreInventory(store.id);
      setStoreInventory(response.data.data);
    } catch (err) {
      console.error('Falha ao carregar inventário da loja:', err);
    }
  };

  const handleSync = async (storeId) => {
    try {
      await storeAPI.syncStore(storeId);
      alert('Loja sincronizada com sucesso na nuvem!');
      fetchStores();
    } catch (err) {
      alert('Falha ao sincronizar loja');
      console.error(err);
    }
  };

  const handleDeleteStore = async (store) => {
    // Get inventory count for this store
    const storeInventoryCount = store.inventoryCount || 0;
    
    const confirmMessage = `⚠️ ATENÇÃO: Esta ação é IRREVOGÁVEL!

Você está prestes a remover a loja "${store.name}".

Isso irá:
• Remover a loja permanentemente
• Remover TODOS os ${storeInventoryCount} item(ns) de inventário desta loja
• Perder todos os dados associados

Tem certeza absoluta que deseja continuar?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Second confirmation
    const finalConfirm = window.confirm(`Última confirmação: Remover "${store.name}" e todos os seus ${storeInventoryCount} itens?`);
    
    if (!finalConfirm) {
      return;
    }

    try {
      const response = await storeAPI.deleteStore(store.id);
      alert(response.data.message);
      setSelectedStore(null);
      setStoreInventory([]);
      fetchStores();
    } catch (err) {
      alert('Erro ao remover loja: ' + (err.response?.data?.error || err.message));
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Carregando lojas...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#667eea' }}>
          🏪 Gestão de Lojas
        </h1>
        <button
          onClick={() => navigate('/add-store')}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ➕ Adicionar Loja
        </button>
      </div>

      <div className="grid">
        {stores.map((store) => (
          <div
            key={store.id}
            className="card"
            style={{
              cursor: 'pointer',
              border: selectedStore?.id === store.id ? '2px solid #667eea' : 'none'
            }}
            onClick={() => handleStoreSelect(store)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>{store.name}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  📍 {store.location}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#999' }}>
                  Tipo: <span className="badge badge-low">{store.type === 'local' ? 'Local' : 'Nuvem'}</span>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                {store.type === 'local' && (
                  <button
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSync(store.id);
                    }}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    ☁️ Sincronizar
                  </button>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStore(store);
                  }}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.8rem',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  🗑️ Remover
                </button>
              </div>
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#666' }}>Produtos</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea' }}>
                    {store.inventoryCount}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#666' }}>Valor Total</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>
                    R$ {store.totalValue}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedStore && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2>📦 Inventário - {selectedStore.name}</h2>
          {storeInventory.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>SKU</th>
                    <th>Quantidade</th>
                    <th>Preço</th>
                    <th>Valor Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {storeInventory.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td>
                        <span className="badge badge-success">
                          {item.productCategory}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#666' }}>
                        {item.productSku}
                      </td>
                      <td>
                        <strong>{item.quantity}</strong>
                      </td>
                      <td>R$ {item.productPrice}</td>
                      <td>R$ {item.totalValue}</td>
                      <td>
                        {item.needsRestock ? (
                          <span className="badge badge-danger">Estoque Baixo</span>
                        ) : (
                          <span className="badge badge-success">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Nenhum dado de inventário disponível</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Stores;

// Made with Bob
