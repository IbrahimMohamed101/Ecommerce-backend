/**
 * 404 Not Found middleware.
 * Should be placed after all valid routes.
 */
module.exports = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: {
      statusCode: 404,
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
};
