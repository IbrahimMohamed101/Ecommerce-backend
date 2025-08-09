module.exports = function registerRoutes(app) {
  // Public routes (root, health)
  app.use('/', require('./public'));

  // Auth routes
  app.use('/auth', require('./authRoutes'));
  app.use('/auth', require('./auth'));

  // Admin management (protected)
  app.use('/api/admin', require('./adminManagement'));

};
