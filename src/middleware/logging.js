const morgan = require('morgan');
const requestLogger = require('./requestLogger');

// Debug headers middleware (moved from app.js)
function debugHeaders(req, res, next) {
    const supertokens = require('supertokens-node');

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

/**
 * Combined logging middleware list.
 */
module.exports = [
    requestLogger,
    morgan('dev'),
    debugHeaders
];
