const dynamodbService = require('../services/dynamodbService');
const { stores, products, inventory } = require('../utils/mockData');

/**
 * Script to migrate mock data to DynamoDB
 * Run with: node src/scripts/migrateData.js
 */

async function migrate() {
  console.log('🚀 Starting data migration to DynamoDB...\n');
  
  try {
    // Migrate stores
    console.log('📦 Migrating stores...');
    for (const store of stores) {
      await dynamodbService.createStore(store);
      console.log(`  ✅ Store migrated: ${store.name}`);
    }
    console.log(`✅ ${stores.length} stores migrated successfully!\n`);
    
    // Migrate products
    console.log('📦 Migrating products...');
    for (const product of products) {
      await dynamodbService.createProduct(product);
      console.log(`  ✅ Product migrated: ${product.name}`);
    }
    console.log(`✅ ${products.length} products migrated successfully!\n`);
    
    // Migrate inventory
    console.log('📦 Migrating inventory items...');
    for (const item of inventory) {
      await dynamodbService.createInventoryItem(item);
      const product = products.find(p => p.id === item.productId);
      const store = stores.find(s => s.id === item.storeId);
      console.log(`  ✅ Inventory migrated: ${product?.name} at ${store?.name} (${item.quantity} units)`);
    }
    console.log(`✅ ${inventory.length} inventory items migrated successfully!\n`);
    
    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Stores: ${stores.length}`);
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Inventory Items: ${inventory.length}`);
    console.log('\n✅ All data has been migrated to DynamoDB!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n✨ You can now use the application with DynamoDB!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

// Made with Bob
