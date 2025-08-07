const logger = require('../utils/logger');

/**
 * Setup all routes for the Express app
 * @param {Express} app - Express application instance
 */
function setupRoutes(app) {
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        });
    });

    // Root route
    app.get('/', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Welcome to E-Commerce Backend API',
            documentation: 'Please refer to the API documentation for available endpoints',
            version: '1.0.0',
            status: 'operational',
            environment: process.env.NODE_ENV || 'development'
        });
    });

    // Auth routes
    app.use('/auth', require('../routes/authRoutes'));
    app.use('/auth', require('../routes/auth'));

    // API routes
    app.use('/api/test-email', require('../routes/test-email'));
    
    // Mount admin management routes
    const adminManagementRoutes = require('../routes/adminManagement');
    adminManagementRoutes(app);
    
    // // Product and category routes
    // app.use('/api/products', require('../routes/products'));
    // app.use('/api/categories', require('../routes/categories'));
    // app.use('/api/reviews', require('../routes/reviews'));
    
    // // Order and cart routes
    // app.use('/api/orders', require('../routes/orders'));
    // app.use('/api/cart', require('../routes/cart'));
    // app.use('/api/wishlist', require('../routes/wishlist'));
    
    // // Payment and coupon routes
    // app.use('/api/payments', require('../routes/payments'));
    // app.use('/api/coupons', require('../routes/coupons'));
    
    // Admin routes
    // app.use('/api/admin', require('../routes/admin'));

    logger.info('✅ All routes configured successfully');
}

module.exports = { setupRoutes };