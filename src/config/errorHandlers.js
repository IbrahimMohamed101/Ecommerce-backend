const { errorHandler: stErrorHandler } = require("supertokens-node/framework/express");
const logger = require('../utils/logger');

/**
 * Setup error handlers for the Express app
 * @param {Express} app - Express application instance
 */
function setupErrorHandlers(app) {
    // SuperTokens error handler (must be before other error handlers)
    app.use(stErrorHandler());

    // 404 handler - Route not found
    app.use((req, res, next) => {
        const error = {
            success: false,
            message: 'Route not found',
            error: {
                statusCode: 404,
                message: `Cannot ${req.method} ${req.originalUrl}`,
                timestamp: new Date().toISOString(),
                path: req.originalUrl,
                method: req.method
            }
        };

        logger.warn('Route not found:', {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(404).json(error);
    });

    // Global error handler
    app.use((err, req, res, next) => {
        // Log the error
        logger.error('❌ Unhandled error:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            body: req.method !== 'GET' ? req.body : undefined
        });

        // Determine status code
        const statusCode = err.statusCode || err.status || 500;
        
        // Prepare error response
        const errorResponse = {
            success: false,
            message: getErrorMessage(err, statusCode),
            error: {
                statusCode,
                message: getErrorMessage(err, statusCode),
                timestamp: new Date().toISOString(),
                path: req.originalUrl,
                method: req.method,
                ...(process.env.NODE_ENV === 'development' && { 
                    stack: err.stack,
                    details: err 
                })
            }
        };

        // Handle specific error types
        if (err.name === 'ValidationError') {
            errorResponse.error.validationErrors = Object.values(err.errors).map(e => e.message);
        }

        if (err.name === 'CastError') {
            errorResponse.message = 'Invalid ID format';
            errorResponse.error.message = 'Invalid ID format';
        }

        if (err.code === 11000) {
            errorResponse.message = 'Duplicate field value';
            errorResponse.error.message = 'Duplicate field value';
            errorResponse.error.field = Object.keys(err.keyValue)[0];
        }

        res.status(statusCode).json(errorResponse);
    });

    logger.info('✅ Error handlers configured successfully');
}

/**
 * Get appropriate error message based on error type and status code
 */
function getErrorMessage(err, statusCode) {
    if (err.message && statusCode < 500) {
        return err.message;
    }
    
    switch (statusCode) {
        case 400:
            return 'Bad Request';
        case 401:
            return 'Unauthorized';
        case 403:
            return 'Forbidden';
        case 404:
            return 'Not Found';
        case 409:
            return 'Conflict';
        case 422:
            return 'Unprocessable Entity';
        case 429:
            return 'Too Many Requests';
        case 500:
        default:
            return process.env.NODE_ENV === 'production' 
                ? 'Internal Server Error' 
                : err.message || 'Internal Server Error';
    }
}

module.exports = { setupErrorHandlers };