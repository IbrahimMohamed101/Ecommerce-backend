const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl, headers } = req;
    const body = req.body || {}; // Ensure body is always an object
    
    // Log the incoming request
    console.log('\n=== Incoming Request ===');
    console.log(`${method} ${originalUrl}`);
    console.log('Headers:', {
        origin: headers.origin || 'Not set',
        cookie: headers.cookie ? 'Set' : 'Not set',
        'content-type': headers['content-type'] || 'Not set',
        authorization: headers.authorization ? 'Set' : 'Not set',
        rid: headers.rid || 'Not set',
        'fdi-version': headers['fdi-version'] || 'Not set',
        'st-auth-mode': headers['st-auth-mode'] || 'Not set'
    });
    
    if (Object.keys(body).length > 0) {
        console.log('Body:', JSON.stringify(body, null, 2));
    }
    console.log('========================');
    
    // Store the original send function
    const originalSend = res.send;
    
    // Override the response's send function
    res.send = function (body) {
        const responseTime = Date.now() - start;
        
        // Log the response
        console.log('\n=== Outgoing Response ===');
        console.log(`Status: ${res.statusCode}`);
        console.log(`Time: ${responseTime}ms`);
        
        // Log response headers
        console.log('Headers:', {
            'set-cookie': res.getHeader('set-cookie') ? 'Set' : 'Not set',
            'access-control-allow-origin': res.getHeader('access-control-allow-origin') || 'Not set',
            'access-control-allow-credentials': res.getHeader('access-control-allow-credentials') || 'Not set'
        });
        
        // Log response body (be careful with sensitive data in production)
        if (body) {
            try {
                const json = JSON.parse(body);
                console.log('Response:', JSON.stringify({
                    ...json,
                    // Hide sensitive data in logs
                    ...(json.user && { user: { id: json.user.id, email: json.user.email } }),
                    ...(json.tokens && { tokens: '***' })
                }, null, 2));
            } catch (e) {
                console.log('Response:', body);
            }
        }
        console.log('========================');
        
        // Call the original send function
        return originalSend.apply(res, arguments);
    };
    
    next();
};

module.exports = requestLogger;
