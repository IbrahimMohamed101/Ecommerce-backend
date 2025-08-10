module.exports = function registerRoutes(app) {
  // Public routes (root, health, verification)
  app.use('/', require('./public'));
  app.use('/', require('./verificationRoutes')); // Add verification routes

  // Auth routes
  app.use('/auth', require('./authRoutes'));
  app.use('/auth', require('./auth'));

  // Admin management (protected)
  app.use('/api/admin', require('./adminManagement'));

  // Vendor routes (protected)
  app.use('/api/vendors', require('./vendorRoutes'));
};
