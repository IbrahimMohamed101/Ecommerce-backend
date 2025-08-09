const cors = require('cors');
const { middleware: supertokensMiddleware } = require('supertokens-node/framework/express');

const getCorsOptions = require('../config/cors');
const securityMiddleware = require('./security');
const loggingMiddleware = require('./logging');

// CORS options
const corsOptions = getCorsOptions();

// Middleware to allow requests without Origin header (e.g., Postman)
function allowNoOrigin(req, res, next) {
  if (!req.headers.origin || req.headers.origin === 'Not set') {
    res.header('Access-Control-Allow-Origin', process.env.WEBSITE_DOMAIN || 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
}

// Export combined middleware list
module.exports = [
  ...loggingMiddleware,
  cors(corsOptions),
  allowNoOrigin,
  supertokensMiddleware(),
  ...securityMiddleware
];
