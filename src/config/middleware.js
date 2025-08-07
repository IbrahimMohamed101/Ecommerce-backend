const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const express = require('express');
const supertokens = require("supertokens-node");
const { middleware } = require("supertokens-node/framework/express");

const logger = require('../utils/logger');
const requestLogger = require('../middleware/requestLogger');
const getCorsOptions = require('./cors');

/**
 * Setup all middleware for the Express app
 * @param {Express} app - Express application instance
 */
function setupMiddleware(app) {
    // Request logging
    app.use(requestLogger);

    // Get CORS options (this will be called for each request)
    const corsMiddleware = (req, res, next) => {
        const corsOptions = getCorsOptions();
        cors(corsOptions)(req, res, next);
    };

    // Apply CORS middleware
    app.use(corsMiddleware);
    app.options('*', corsMiddleware);

    // Handle requests with no origin (Postman, mobile apps, etc.)
    app.use((req, res, next) => {
        if (!req.headers.origin || req.headers.origin === 'Not set') {
            res.header('Access-Control-Allow-Origin', process.env.WEBSITE_DOMAIN || 'http://localhost:3000');
            res.header('Access-Control-Allow-Credentials', 'true');
        }
        next();
    });

    // SuperTokens middleware
    app.use(middleware());

    // Security headers
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        originAgentCluster: false,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        xssFilter: true
    }));

    // Compression
    app.use(compression());

    // Logging
    if (process.env.NODE_ENV !== 'test') {
        app.use(morgan('dev'));
    }

    // Request debugging (development only)
    if (process.env.NODE_ENV === 'development') {
        app.use(requestDebugging);
    }

    // Body parsers
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    app.use('/uploads', express.static('uploads'));

    logger.info('✅ All middleware configured successfully');
}

/**
 * Debugging middleware to log request details
 */
function requestDebugging(req, res, next) {
    console.log('\n=== Incoming Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Headers:', {
        origin: req.headers.origin,
        'content-type': req.headers['content-type'],
        authorization: req.headers.authorization ? '***' : 'Not set',
        cookie: req.headers.cookie ? '***' : 'Not set',
        ...supertokens.getAllCORSHeaders().reduce((acc, header) => {
            acc[header] = req.headers[header.toLowerCase()] ? '***' : 'Not set';
            return acc;
        }, {})
    });
    console.log('========================\n');
    next();
}

module.exports = { setupMiddleware };