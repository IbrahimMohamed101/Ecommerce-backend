// Load environment variables first
require('dotenv').config({ path: '.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const supertokens = require("supertokens-node");
const { middleware, errorHandler: stErrorHandler } = require("supertokens-node/framework/express");
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');

// Initialize app
const app = express();

// Log environment info
logger.info('🚀 Starting server initialization...', {
    node_env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000
});

const { initSupertokens } = require('./config/supertokens');
// Initialize SuperTokens first
logger.info('Initializing SuperTokens...');
initSupertokens();
logger.info('✅ SuperTokens initialized successfully');

// Then connect to MongoDB
logger.info('Connecting to MongoDB...');
const connectDB = require('./config/database');
connectDB();
logger.info('✅ MongoDB connected successfully');

// Configure CORS with more specific settings
const allowedOrigins = [
    process.env.WEBSITE_DOMAIN || 'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://localhost',
    'http://127.0.0.1',
    'https://localhost:3000',
    'https://localhost:3001'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Treat 'Not set' string as no origin (like mobile apps or curl requests)
        if (!origin || origin === 'Not set') {
            console.log('No origin header or "Not set" in request - allowing for development');
            return callback(null, true);
        }

        // In development, allow all localhost origins
        if (process.env.NODE_ENV === 'development') {
            const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
            if (isLocalhost) {
                console.log('Development mode - Allowing localhost origin:', origin);
                return callback(null, true);
            }
        }

        // Check if the origin is in the allowed list
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            try {
                return origin === allowedOrigin || 
                    (origin && new URL(origin).hostname === new URL(allowedOrigin).hostname);
            } catch (e) {
                console.warn('Error checking origin:', e.message);
                return false;
            }
        });

        if (isAllowed) {
            console.log('Allowed origin:', origin);
            return callback(null, true);
        }

        console.log('Blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'rid',
        'fdi-version',
        'st-auth-mode',
        'st-csrf-token',
        'st-tenant-id',
        'x-requested-with',
        'x-csrf-token',
        'x-xsrf-token',
        'x-forwarded-proto',
        'x-forwarded-host',
        'x-forwarded-port',
        ...supertokens.getAllCORSHeaders()
    ],
    exposedHeaders: [
        'st-access-token',
        'st-refresh-token',
        'st-last-access-token-update',
        'set-cookie',
        ...supertokens.getAllCORSHeaders()
    ],
    optionsSuccessStatus: 200,
    maxAge: 600, // 10 minutes
    preflightContinue: false
};

// Apply request logger first
app.use(requestLogger);

// Apply CORS with the above configuration
// Apply CORS with the above options
app.use(cors(corsOptions));

// Fix: Set Access-Control-Allow-Origin for requests with no origin (like Postman, mobile, curl)
app.use((req, res, next) => {
    if (!req.headers.origin || req.headers.origin === 'Not set') {
        res.header('Access-Control-Allow-Origin', process.env.WEBSITE_DOMAIN || 'http://localhost:3000');
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    next();
});

// Apply SuperTokens middleware
app.use(middleware());

// Handle preflight requests
app.options('*', cors(corsOptions));

/* Removed custom middleware that manually sets CORS headers to avoid setting invalid Access-Control-Allow-Origin header.
   Rely on cors middleware to handle CORS headers properly. */

// Intercept OPTIONS method for preflight requests handled by cors middleware
app.options('*', cors(corsOptions));

app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// Debugging middleware to log headers
app.use((req, res, next) => {
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
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Email verification route
const verifyEmailRouter = require('./routes/verifyEmail');
app.use('/', verifyEmailRouter);

// SuperTokens middleware
app.use(middleware());

// Routes
app.use('/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));

// Test email route (development only)
if (process.env.NODE_ENV !== 'production') {
    app.use('/api', require('./routes/testEmail'));
}

// SuperTokens error handler
app.use(stErrorHandler());

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        error: {
            statusCode: 404,
            message: `Cannot ${req.method} ${req.originalUrl}`
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('❌ Unhandled error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: {
            statusCode: err.statusCode || 500,
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = app;
