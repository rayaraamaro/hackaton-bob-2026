const AWS = require('aws-sdk');
require('dotenv').config();

// Check if AWS credentials are configured
const hasValidCredentials =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_ACCESS_KEY_ID !== 'your_access_key_here' &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_SECRET_ACCESS_KEY !== 'your_secret_key_here';

let dynamodb = null;
let useMockData = !hasValidCredentials;

if (hasValidCredentials) {
  try {
    AWS.config.update({
      region: process.env.AWS_REGION || 'sa-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    dynamodb = new AWS.DynamoDB.DocumentClient();
    console.log('✅ DynamoDB configured successfully');
  } catch (error) {
    console.error('❌ Error configuring DynamoDB:', error.message);
    useMockData = true;
  }
} else {
  console.log('⚠️  AWS credentials not configured. Using mock data.');
  console.log('📝 To use DynamoDB, configure credentials in backend/.env');
}

module.exports = {
  dynamodb,
  useMockData,
  tables: {
    stores: process.env.DYNAMODB_STORES_TABLE || 'bicycle-stores',
    products: process.env.DYNAMODB_PRODUCTS_TABLE || 'bicycle-products',
    inventory: process.env.DYNAMODB_INVENTORY_TABLE || 'bicycle-inventory'
  }
};
