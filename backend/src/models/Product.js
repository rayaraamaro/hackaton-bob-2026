const { v4: uuidv4 } = require('uuid');

/**
 * Product Model
 * Represents a bicycle product (bikes, parts, accessories)
 */
class Product {
  constructor(name, category, price, sku) {
    this.id = uuidv4();
    this.name = name;
    this.category = category; // 'bikes', 'parts', 'accessories'
    this.price = price;
    this.sku = sku; // Stock Keeping Unit
    this.createdAt = new Date();
  }
}

module.exports = Product;

// Made with Bob
