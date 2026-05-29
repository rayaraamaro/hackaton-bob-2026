import axios from 'axios';

/**
 * API Service
 * Handles all API calls to the backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store API
export const storeAPI = {
  getAllStores: () => api.get('/stores'),
  getStoreById: (id) => api.get(`/stores/${id}`),
  createStore: (data) => api.post('/stores', data),
  deleteStore: (id) => api.delete(`/stores/${id}`),
  syncStore: (id) => api.post(`/stores/${id}/sync`),
};

// Inventory API
export const inventoryAPI = {
  getAllInventory: (params) => api.get('/inventory', { params }),
  getGlobalInventory: () => api.get('/inventory/global'),
  getStoreInventory: (storeId) => api.get(`/inventory/store/${storeId}`),
  addInventoryItem: (data) => api.post('/inventory', data),
  updateInventory: (id, data) => api.put(`/inventory/${id}`, data),
  deleteInventoryItem: (id) => api.delete(`/inventory/${id}`),
  transferStock: (data) => api.post('/inventory/transfer', data),
};

// AI API
export const aiAPI = {
  getRestockingSuggestions: () => api.get('/ai/restock'),
  getRedistributionSuggestions: () => api.get('/ai/redistribute'),
  getInsights: () => api.get('/ai/insights'),
  askAssistant: (query) => api.post('/ai/assistant', { query }),
};

export default api;

// Made with Bob
