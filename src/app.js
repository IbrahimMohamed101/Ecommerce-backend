    // app.js
    require('dotenv').config({ path: '.env' });

    const express = require('express');
    const cors = require('cors');
    const supertokens = require('supertokens-node');
    const { middleware, errorHandler } = require('supertokens-node/framework/express');

    const logger = require('./utils/logger');

    /* --- 1.  Configuration & Infrastructure --- */
    const { initSupertokens } = require('./config/supertokens');
    const connectDB = require('./config/database');
    const getCorsOptions = require('./config/cors');

    /* --- 2.  Modular helpers --- */
    const loggingMiddleware = require('./middleware/logging');
    const securityMiddleware = require('./middleware/security');
    const notFound = require('./middleware/notFound');
    const genericErrorHandler = require('./middleware/errorHandler');

    /* --- 3.  Route modules --- */
    const registerRoutes = require('./routes');   // centralised route loader

    /* --- 4.  Create & configure Express --- */
    const app = express();

    logger.info('🚀 Starting server initialization...', {
    node_env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    });

    /* --- 4a.  Initialize SuperTokens & DB (once) --- */
    initSupertokens({
    session: {
        accessTokenValidity: 60 * 60 * 24 * 7,   // 7 days
        refreshTokenValidity: 60 * 60 * 24 * 30, // 30 days
        cookieSameSite: 'lax',
        cookieSecure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN || 'localhost',
    },
    });
    connectDB();

    /* --- 4b.  Global middleware --- */
    app.use(...loggingMiddleware);                       // morgan + debug headers
    app.use(cors(getCorsOptions()));                     // CORS
    app.use((req, res, next) => {                        // fallback CORS header
    if (!req.headers.origin || req.headers.origin === 'Not set') {
        res.header('Access-Control-Allow-Origin', process.env.WEBSITE_DOMAIN || 'http://localhost:3000');
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    next();
    });

    app.use(middleware());                               // SuperTokens
    app.use(...securityMiddleware);                      // helmet, compression, etc.

    /* --- 4c.  Body parsers & static files --- */
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use('/uploads', express.static('uploads'));

    /* --- 5.  Routes --- */
    app.get('/', (req, res) =>
    res.json({
        success: true,
        message: 'Welcome to E-Commerce Backend API',
        documentation: 'Please refer to the API documentation for available endpoints',
        version: '1.0.0',
        status: 'operational',
    })
    );

    app.get('/health', (req, res) =>
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    })
    );

    // Centralised route registration
    registerRoutes(app);

    /* --- 6.  Error handling --- */
    app.use(errorHandler());   // SuperTokens
    app.use(notFound);         // 404
    app.use(genericErrorHandler);

    module.exports = app;