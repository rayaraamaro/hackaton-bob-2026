const { dynamodb, tables, useMockData } = require('../config/dynamodb');
const { stores, products, inventory } = require('../utils/mockData');

class DynamoDBService {
  // Helper to use mock data if DynamoDB is not configured
  _useMockOrDynamo(mockData, dynamoOperation) {
    if (useMockData) {
      return Promise.resolve(mockData);
    }
    return dynamoOperation();
  }
  // STORES
  async getAllStores() {
    return this._useMockOrDynamo(stores, async () => {
      const params = { TableName: tables.stores };
      const result = await dynamodb.scan(params).promise();
      return result.Items;
    });
  }

  async getStoreById(id) {
    return this._useMockOrDynamo(
      stores.find(s => s.id === id),
      async () => {
        const params = { TableName: tables.stores, Key: { id } };
        const result = await dynamodb.get(params).promise();
        return result.Item;
      }
    );
  }

  async createStore(store) {
    if (useMockData) {
      stores.push(store);
      return Promise.resolve(store);
    }
    const params = { TableName: tables.stores, Item: store };
    await dynamodb.put(params).promise();
    return store;
  }

  async updateStore(id, updates) {
    if (useMockData) {
      const store = stores.find(s => s.id === id);
      if (store) Object.assign(store, updates);
      return Promise.resolve(store);
    }
    const updateExpressions = [];
    const expressionAttributeValues = {};
    Object.keys(updates).forEach((key, index) => {
      updateExpressions.push(`${key} = :val${index}`);
      expressionAttributeValues[`:val${index}`] = updates[key];
    });
    const params = {
      TableName: tables.stores,
      Key: { id },
      UpdateExpression: `set ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  }

  async deleteStore(id) {
    if (useMockData) {
      const index = stores.findIndex(s => s.id === id);
      if (index > -1) stores.splice(index, 1);
      return Promise.resolve();
    }
    const params = { TableName: tables.stores, Key: { id } };
    await dynamodb.delete(params).promise();
  }

  // PRODUCTS
  async getAllProducts() {
    return this._useMockOrDynamo(products, async () => {
      const params = { TableName: tables.products };
      const result = await dynamodb.scan(params).promise();
      return result.Items;
    });
  }

  async createProduct(product) {
    if (useMockData) {
      products.push(product);
      return Promise.resolve(product);
    }
    const params = { TableName: tables.products, Item: product };
    await dynamodb.put(params).promise();
    return product;
  }

  // INVENTORY
  async getAllInventory() {
    return this._useMockOrDynamo(inventory, async () => {
      const params = { TableName: tables.inventory };
      const result = await dynamodb.scan(params).promise();
      return result.Items;
    });
  }

  async getInventoryByStore(storeId) {
    return this._useMockOrDynamo(
      inventory.filter(i => i.storeId === storeId),
      async () => {
        const params = {
          TableName: tables.inventory,
          IndexName: 'storeId-index',
          KeyConditionExpression: 'storeId = :storeId',
          ExpressionAttributeValues: { ':storeId': storeId }
        };
        const result = await dynamodb.query(params).promise();
        return result.Items;
      }
    );
  }

  async createInventoryItem(item) {
    if (useMockData) {
      inventory.push(item);
      return Promise.resolve(item);
    }
    const params = { TableName: tables.inventory, Item: item };
    await dynamodb.put(params).promise();
    return item;
  }

  async updateInventoryItem(id, updates) {
    if (useMockData) {
      const item = inventory.find(i => i.id === id);
      if (item) {
        item.quantity = updates.quantity;
        item.lastUpdated = new Date().toISOString();
      }
      return Promise.resolve(item);
    }
    const params = {
      TableName: tables.inventory,
      Key: { id },
      UpdateExpression: 'set quantity = :q, lastUpdated = :lu',
      ExpressionAttributeValues: {
        ':q': updates.quantity,
        ':lu': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };
    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  }

  async deleteInventoryItem(id) {
    if (useMockData) {
      const index = inventory.findIndex(i => i.id === id);
      if (index > -1) inventory.splice(index, 1);
      return Promise.resolve();
    }
    const params = { TableName: tables.inventory, Key: { id } };
    await dynamodb.delete(params).promise();
  }
}

module.exports = new DynamoDBService();
