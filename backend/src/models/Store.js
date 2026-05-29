const { v4: uuidv4 } = require('uuid');

/**
 * Store Model
 * Represents a physical bicycle store location
 */
class Store {
  constructor(name, location, type = 'local') {
    this.id = uuidv4();
    this.name = name;
    this.location = location;
    this.type = type; // 'local' for edge stores, 'central' for cloud
    this.createdAt = new Date();
    this.lastSyncAt = new Date();
  }
}

module.exports = Store;

// Made with Bob
