const Store = require('../models/Store');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');

/**
 * Generate mock data for the bicycle inventory system
 * Simulates multiple stores with realistic inventory
 */

// Create stores
const stores = [
  new Store('Downtown Bikes', 'New York, NY', 'local'),
  new Store('Coastal Cycles', 'San Francisco, CA', 'local'),
  new Store('Mountain Gear', 'Denver, CO', 'local'),
  new Store('Urban Riders', 'Chicago, IL', 'local'),
  new Store('Central Hub', 'Cloud Data Center', 'central')
];

// Create products
const products = [
  // Bikes
  new Product('Mountain Pro X1', 'bikes', 1299.99, 'MTB-001'),
  new Product('Road Racer Elite', 'bikes', 1899.99, 'RDB-001'),
  new Product('City Cruiser Comfort', 'bikes', 699.99, 'CTY-001'),
  new Product('Electric Commuter', 'bikes', 2499.99, 'ELC-001'),
  new Product('Kids Adventure 20"', 'bikes', 349.99, 'KID-001'),
  new Product('Hybrid Sport', 'bikes', 899.99, 'HYB-001'),
  new Product('BMX Freestyle', 'bikes', 449.99, 'BMX-001'),
  new Product('Gravel Explorer', 'bikes', 1599.99, 'GRV-001'),
  
  // Parts
  new Product('Carbon Fiber Wheels', 'parts', 599.99, 'WHL-001'),
  new Product('Hydraulic Disc Brakes', 'parts', 149.99, 'BRK-001'),
  new Product('Shimano Gear Set', 'parts', 299.99, 'GER-001'),
  new Product('Suspension Fork', 'parts', 399.99, 'SUS-001'),
  new Product('Bike Chain Premium', 'parts', 29.99, 'CHN-001'),
  new Product('Pedal Set Pro', 'parts', 79.99, 'PDL-001'),
  new Product('Saddle Comfort Plus', 'parts', 89.99, 'SDL-001'),
  new Product('Handlebar Carbon', 'parts', 129.99, 'HND-001'),
  
  // Accessories
  new Product('LED Light Set', 'accessories', 39.99, 'LGT-001'),
  new Product('Bike Lock Heavy Duty', 'accessories', 49.99, 'LCK-001'),
  new Product('Water Bottle Holder', 'accessories', 14.99, 'BTL-001'),
  new Product('Helmet Pro Safety', 'accessories', 79.99, 'HLM-001'),
  new Product('Bike Pump Portable', 'accessories', 24.99, 'PMP-001'),
  new Product('Repair Kit Complete', 'accessories', 34.99, 'RPR-001'),
  new Product('Phone Mount', 'accessories', 19.99, 'PHN-001'),
  new Product('Bike Bag Waterproof', 'accessories', 44.99, 'BAG-001')
];

/**
 * Generate inventory items with realistic quantities and sales history
 */
function generateInventory() {
  const inventory = [];
  
  // Only create inventory for local stores (not central hub)
  const localStores = stores.filter(s => s.type === 'local');
  
  localStores.forEach(store => {
    products.forEach(product => {
      // Generate random but realistic quantities based on product category
      let baseQuantity;
      let reorderPoint;
      
      if (product.category === 'bikes') {
        baseQuantity = Math.floor(Math.random() * 15) + 5; // 5-20 bikes
        reorderPoint = 5;
      } else if (product.category === 'parts') {
        baseQuantity = Math.floor(Math.random() * 40) + 10; // 10-50 parts
        reorderPoint = 10;
      } else {
        baseQuantity = Math.floor(Math.random() * 60) + 20; // 20-80 accessories
        reorderPoint = 15;
      }
      
      const item = new InventoryItem(store.id, product.id, baseQuantity, reorderPoint);
      
      // Generate mock sales history (last 30 days)
      const daysOfHistory = 30;
      for (let i = 0; i < daysOfHistory; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Random sales with some products being more popular
        const salesProbability = Math.random();
        if (salesProbability > 0.6) { // 40% chance of sale on any given day
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 units sold
          item.salesHistory.push({ date, quantity });
        }
      }
      
      // Sort sales history by date (oldest first)
      item.salesHistory.sort((a, b) => a.date - b.date);
      
      inventory.push(item);
    });
  });
  
  return inventory;
}

// Generate initial inventory
const inventory = generateInventory();

module.exports = {
  stores,
  products,
  inventory,
  generateInventory
};

// Made with Bob
