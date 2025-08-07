const supertokens = require("supertokens-node");
const logger = require('../utils/logger');

/**
 * Get default allowed origins based on environment
 */
function getDefaultOrigins() {
    const defaultProductionUrl = 'https://ecommerce-backend-l7a2.onrender.com';
    const defaultDevelopmentUrls = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://localhost',
        'http://127.0.0.1',
        'https://localhost:3000',
        'https://localhost:3001'
    ];

    // Get origins from environment variables
    const envOrigins = [
        process.env.NEXT_PUBLIC_WEBSITE_DOMAIN,
        process.env.WEBSITE_DOMAIN,
        process.env.CLIENT_URL,
        process.env.APP_URL
    ].filter(Boolean);

    // Combine all origins, remove duplicates
    const origins = [
        ...new Set([
            ...envOrigins,
            ...(process.env.NODE_ENV === 'production' 
                ? [defaultProductionUrl, `https://${defaultProductionUrl}`, `http://${defaultProductionUrl}`] 
                : defaultDevelopmentUrls)
        ])
    ];

    return origins;
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin, allowedOrigins) {
    if (!origin || origin === 'Not set') {
        return true; // Allow requests with no origin (mobile apps, Postman, etc.)
    }

    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development') {
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        if (isLocalhost) {
            return true;
        }
    }

    // Check if the origin is in the allowed list
    return allowedOrigins.some(allowedOrigin => {
        try {
            return origin === allowedOrigin || 
                (origin && new URL(origin).hostname === new URL(allowedOrigin).hostname);
        } catch (e) {
            logger.warn('Error checking origin:', { error: e.message, origin, allowedOrigin });
            return false;
        }
    });
}

// Get allowed origins
const allowedOrigins = getDefaultOrigins();
logger.info('Configured CORS allowed origins:', { allowedOrigins });

// Common headers that don't depend on SuperTokens initialization
const commonHeaders = [
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
    'x-forwarded-port'
];

const commonExposedHeaders = [
    'st-access-token',
    'st-refresh-token',
    'st-last-access-token-update',
    'set-cookie'
];

/**
 * Get CORS options with proper SuperTokens headers
 */
function getCorsOptions() {
    // Get SuperTokens headers if initialized, otherwise use empty array
    let supertokensHeaders = [];
    try {
        // Try to get headers, will throw if not initialized
        supertokensHeaders = supertokens.getAllCORSHeaders() || [];
    } catch (e) {
        // If SuperTokens is not initialized yet, use empty array
        supertokensHeaders = [];
    }

    return {
        origin: function (origin, callback) {
            const isAllowed = isOriginAllowed(origin, allowedOrigins);
            
            if (isAllowed) {
                if (origin) {
                    logger.debug('Allowed origin:', origin);
                }
                return callback(null, true);
            }

            logger.warn('Blocked origin:', origin);
            return callback(new Error('Not allowed by CORS'));
        },
        
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [...commonHeaders, ...supertokensHeaders],
        exposedHeaders: [...commonExposedHeaders, ...supertokensHeaders],
        optionsSuccessStatus: 200,
        maxAge: 600, // 10 minutes
        preflightContinue: false
    };
}

// Export a function that returns CORS options to ensure SuperTokens is initialized first
module.exports = getCorsOptions;