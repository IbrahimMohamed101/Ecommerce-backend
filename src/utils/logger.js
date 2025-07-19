    const winston = require('winston');
    const config = require('../config/environment');
    const { combine, timestamp, printf, colorize, json } = winston.format;

    // Define custom log format
    const logFormat = printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
    });

    // Create logger instance
    const logger = winston.createLogger({
    level: config.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        config.NODE_ENV === 'development' ? colorize() : json(),
        logFormat
    ),
    transports: [
        // Console transport
        new winston.transports.Console({
        format: combine(colorize(), logFormat),
        }),
        // File transport for errors
        new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        }),
        // File transport for all logs
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
    ],
    });

    // Add custom methods for different log levels
    logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
    };

    // Add request logging middleware
    logger.requests = (req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        body: req.body,
        query: req.query,
        params: req.params,
    });
    next();
    };

    module.exports = logger;