const express = require('express');
const router = express.Router();

// Root endpoint - API welcome/info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to E-Commerce Backend API',
    documentation: 'Please refer to the API documentation for available endpoints',
    version: '1.0.0',
    status: 'operational',
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router;
