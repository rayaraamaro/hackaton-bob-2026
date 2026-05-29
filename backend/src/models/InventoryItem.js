const { v4: uuidv4 } = require('uuid');

/**
 * InventoryItem Model
 * Represents a product's inventory at a specific store
 */
class InventoryItem {
  constructor(storeId, productId, quantity, reorderPoint = 10) {
    this.id = uuidv4();
    this.storeId = storeId;
    this.productId = productId;
    this.quantity = quantity;
    this.reorderPoint = reorderPoint; // Minimum quantity before reorder
    this.lastUpdated = new Date();
    this.salesHistory = []; // Array of {date, quantity} for AI forecasting
  }

  /**
   * Add a sale record for AI forecasting
   */
  addSale(quantity) {
    this.salesHistory.push({
      date: new Date(),
      quantity: quantity
    });
    this.quantity -= quantity;
    this.lastUpdated = new Date();
  }

  /**
   * Add stock (restock operation)
   */
  addStock(quantity) {
    this.quantity += quantity;
    this.lastUpdated = new Date();
  }

  /**
   * Check if item needs restocking
   */
  needsRestock() {
    return this.quantity <= this.reorderPoint;
  }
}

module.exports = InventoryItem;

// Made with Bob
