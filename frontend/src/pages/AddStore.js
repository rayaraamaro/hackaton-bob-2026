import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAPI } from '../services/api';

/**
 * Add Store Page
 * Form to add new stores
 */
function AddStore() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'local'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await storeAPI.createStore(formData);
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        type: 'local'
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/stores');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao adicionar loja');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/stores')}
          className="btn btn-secondary"
          style={{ marginRight: '1rem' }}
        >
          ← Voltar
        </button>
        <h1 style={{ margin: 0, color: '#667eea' }}>
          🏪 Adicionar Nova Loja
        </h1>
      </div>

      {error && (
        <div className="card" style={{ background: '#fee', border: '1px solid #fcc', marginBottom: '1rem' }}>
          <p style={{ color: '#c00', margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {success && (
        <div className="card" style={{ background: '#efe', border: '1px solid #cfc', marginBottom: '1rem' }}>
          <p style={{ color: '#0a0', margin: 0 }}>✅ Loja adicionada com sucesso! Redirecionando...</p>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Store Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Nome da Loja *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Loja Centro"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Localização *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="Ex: São Paulo, SP"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Type */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Tipo de Loja *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              >
                <option value="local">Local</option>
                <option value="central">Central (Nuvem)</option>
              </select>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                Lojas locais podem sincronizar com a nuvem. Lojas centrais são apenas na nuvem.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/stores')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Adicionando...' : '✅ Adicionar Loja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStore;

// Made with Bob