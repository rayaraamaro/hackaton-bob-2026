const dynamodbService = require('../services/dynamodbService');
const Store = require('../models/Store');

/**
 * Store Controller
 * Handles store-related API requests with DynamoDB
 */

class StoreController {
  /**
   * Get all stores
   */
  static async getAllStores(req, res) {
    try {
      const stores = await dynamodbService.getAllStores();
      const products = await dynamodbService.getAllProducts();
      const inventory = await dynamodbService.getAllInventory();
      
      const storeData = stores.map(store => {
        const storeInventory = inventory.filter(item => item.storeId === store.id);
        const totalValue = storeInventory.reduce((sum, item) => {
          const product = products.find(p => p.id === item.productId);
          return sum + (product ? product.price * item.quantity : 0);
        }, 0);
        
        return {
          ...store,
          inventoryCount: storeInventory.length,
          totalValue: totalValue.toFixed(2)
        };
      });
      
      res.json({
        success: true,
        data: storeData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get a specific store by ID
   */
  static async getStoreById(req, res) {
    try {
      const { id } = req.params;
      const store = await dynamodbService.getStoreById(id);
      
      if (!store) {
        return res.status(404).json({
          success: false,
          error: 'Store not found'
        });
      }
      
      const inventory = await dynamodbService.getInventoryByStore(id);
      const products = await dynamodbService.getAllProducts();
      
      const totalValue = inventory.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product ? product.price * item.quantity : 0);
      }, 0);
      
      res.json({
        success: true,
        data: {
          ...store,
          inventoryCount: inventory.length,
          totalValue: totalValue.toFixed(2)
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
   * Sync store data with central cloud (simulated)
   */
  static async syncStore(req, res) {
    try {
      const { id } = req.params;
      const store = await dynamodbService.getStoreById(id);
      
      if (!store) {
        return res.status(404).json({
          success: false,
          error: 'Store not found'
        });
      }
      
      // Update lastSyncAt
      store.lastSyncAt = new Date().toISOString();
      await dynamodbService.updateStore(id, { lastSyncAt: store.lastSyncAt });
      
      res.json({
        success: true,
        message: `Store ${store.name} synced successfully`,
        data: {
          storeId: store.id,
          lastSyncAt: store.lastSyncAt
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
   * Create new store
   */
  static async createStore(req, res) {
    try {
      const { name, location, type } = req.body;

      // Validate required fields
      if (!name || !location) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name and location are required'
        });
      }

      // Check if store with same name already exists
      const allStores = await dynamodbService.getAllStores();
      const existingStore = allStores.find(s => s.name.toLowerCase() === name.toLowerCase());
      
      if (existingStore) {
        return res.status(400).json({
          success: false,
          error: 'A store with this name already exists'
        });
      }

      // Create new store
      const newStore = new Store(name, location, type || 'local');
      await dynamodbService.createStore(newStore);

      res.status(201).json({
        success: true,
        message: 'Store created successfully',
        data: {
          ...newStore,
          inventoryCount: 0,
          totalValue: '0.00'
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
   * Delete store and all its inventory items
   */
  static async deleteStore(req, res) {
    try {
      const { id } = req.params;
      
      const store = await dynamodbService.getStoreById(id);
      
      if (!store) {
        return res.status(404).json({
          success: false,
          error: 'Store not found'
        });
      }
      
      // Get all inventory items for this store
      const storeInventory = await dynamodbService.getInventoryByStore(id);
      const itemCount = storeInventory.length;
      
      // Delete all inventory items for this store
      for (const item of storeInventory) {
        await dynamodbService.deleteInventoryItem(item.id);
      }
      
      // Delete the store
      await dynamodbService.deleteStore(id);
      
      res.json({
        success: true,
        message: `Store "${store.name}" and ${itemCount} inventory item(s) deleted successfully`,
        data: {
          deletedStore: {
            id: store.id,
            name: store.name,
            location: store.location
          },
          deletedInventoryItems: itemCount
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

module.exports = StoreController;
