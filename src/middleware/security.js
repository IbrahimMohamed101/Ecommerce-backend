const helmet = require('helmet');
const compression = require('compression');

/**
 * Combined security middleware to be mounted in Express app.
 * Exported as an array so it can be spread directly into app.use(...).
 */
const securityMiddleware = [
    helmet({
        contentSecurityPolicy: false, // Disable CSP as it might block some frontend scripts
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        originAgentCluster: false,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xssFilter: true
    }),
    compression()
];

module.exports = securityMiddleware;
