const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');

/**
 * Bicycle Inventory Management System - Backend Server
 * Hybrid Cloud & AI-driven Architecture
 */

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Bicycle Inventory Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      stores: '/api/stores',
      inventory: '/api/inventory',
      globalInventory: '/api/inventory/global',
      transfer: '/api/inventory/transfer',
      aiRestock: '/api/ai/restock',
      aiRedistribute: '/api/ai/redistribute',
      aiInsights: '/api/ai/insights',
      aiAssistant: '/api/ai/assistant'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚴 Bicycle Inventory Management System');
  console.log('='.repeat(50));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
});

module.exports = app;

// Made with Bob
