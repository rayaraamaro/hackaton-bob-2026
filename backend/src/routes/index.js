const express = require('express');
const StoreController = require('../controllers/storeController');
const InventoryController = require('../controllers/inventoryController');
const AIController = require('../controllers/aiController');

const router = express.Router();

/**
 * API Routes
 * All routes for the bicycle inventory management system
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bicycle Inventory API is running',
    timestamp: new Date()
  });
});

// Store routes
router.post('/stores', StoreController.createStore);
router.get('/stores', StoreController.getAllStores);
router.get('/stores/:id', StoreController.getStoreById);
router.delete('/stores/:id', StoreController.deleteStore);
router.post('/stores/:id/sync', StoreController.syncStore);

// Inventory routes
router.post('/inventory', InventoryController.createInventoryItem);
router.post('/inventory/transfer', InventoryController.transferStock);
router.get('/inventory', InventoryController.getAllInventory);
router.get('/inventory/global', InventoryController.getGlobalInventory);
router.get('/inventory/store/:storeId', InventoryController.getStoreInventory);
router.put('/inventory/:id', InventoryController.updateInventory);
router.delete('/inventory/:id', InventoryController.deleteInventoryItem);

// AI-powered features routes
router.get('/ai/restock', AIController.getRestockingSuggestions);
router.get('/ai/redistribute', AIController.getRedistributionSuggestions);
router.get('/ai/insights', AIController.getInsights);
router.post('/ai/assistant', AIController.askAssistant);

module.exports = router;

// Made with Bob
