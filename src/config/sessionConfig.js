const Session = require("supertokens-node/recipe/session");
const User = require('../models/User');

// Configuration constants
const SESSION_CONFIG = {
    LIFETIME_DAYS: 7,
    LIFETIME_SECONDS: 60 * 60 * 24 * 7, // 7 days
    REFRESH_TOKEN_LIFETIME_DAYS: 30,
    REFRESH_TOKEN_LIFETIME_SECONDS: 60 * 60 * 24 * 30, // 30 days
    COOKIE_MAX_AGE_MS: 60 * 60 * 24 * 7 * 1000, // 1 week
    CORS_HEADERS: [
        'rid',
        'st-auth-mode', 
        'authorization',
        'st-last-access-token-update',
        'content-type',
        'anti-csrf',
        'x-requested-with',
        'x-csrf-token',
        'credentials'
    ]
};

const ENVIRONMENT = {
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    APP_DOMAIN: process.env.APP_DOMAIN || 'http://localhost:3000',
    CLIENT_DOMAIN: process.env.CLIENT_URL || 'http://localhost:3000',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001']
};

/**
 * Enhanced CORS header handler
 */
function getCorsHeaders(context) {
    const origin = context?.req?.get?.('origin') || ENVIRONMENT.CLIENT_DOMAIN;
    const allowedOrigin = ENVIRONMENT.IS_PRODUCTION 
        ? (ENVIRONMENT.ALLOWED_ORIGINS.includes(origin) ? origin : ENVIRONMENT.ALLOWED_ORIGINS[0])
        : (origin || ENVIRONMENT.CLIENT_DOMAIN);

    console.log('CORS Headers - Origin:', origin, 'Allowed Origin:', allowedOrigin);

    const headers = {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': SESSION_CONFIG.CORS_HEADERS.join(', '),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
        'Access-Control-Expose-Headers': 'st-auth-mode, st-last-access-token-update',
        'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers'
    };

    // Add additional security headers in production
    if (ENVIRONMENT.IS_PRODUCTION) {
        headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
        headers['X-Content-Type-Options'] = 'nosniff';
        headers['X-Frame-Options'] = 'DENY';
        headers['X-XSS-Protection'] = '1; mode=block';
    }

    return headers;
}

/**
 * Enhanced session creation with better payload
 */
async function createEnhancedSession(input, originalImplementation) {
    try {
        console.log('🆕 Creating new session for user:', input.userId);
        
        const user = await User.findOne({ supertokensId: input.userId });
        if (!user) {
            console.warn(`⚠️ User not found in database: ${input.userId}`);
        }
        
        // Enhanced access token payload
        const enhancedPayload = {
            ...input.accessTokenPayload,
            // User role and permissions
            role: user?.role || 'customer',
            permissions: user?.permissions || [],
            
            // User identification
            userId: user?._id?.toString(),
            username: user?.username,
            
            // Account status
            isEmailVerified: user?.isEmailVerified || false,
            accountStatus: user?.status || 'active',
            
            // Session metadata
            sessionCreatedAt: Date.now(),
            lastLoginAt: user?.lastLoginAt || Date.now(),
            
            // Device and security info
            deviceInfo: input.deviceInfo,
            ipAddress: input.ipAddress,
            userAgent: input.userAgent
        };
        
        // Create session with enhanced payload
        const session = await originalImplementation.createNewSession({
            ...input,
            accessTokenPayload: enhancedPayload
        });
        
        // Update user's last login time
        if (user) {
            await User.findByIdAndUpdate(user._id, {
                lastLoginAt: new Date(),
                $inc: { loginCount: 1 }
            });
        }
        
        console.log('✅ Enhanced session created successfully');
        return session;
        
    } catch (error) {
        console.error('❌ Error creating enhanced session:', error);
        throw error;
    }
}

/**
 * Enhanced session refresh with activity tracking
 */
async function refreshEnhancedSession(input, originalImplementation) {
    try {
        console.log('🔄 Refreshing session...', input.session?.getUserId());
        
        const session = await originalImplementation.refreshSession(input);
        
        // Update last activity timestamp in the session
        if (session && session.updateAccessTokenPayload) {
            await session.updateAccessTokenPayload({
                ...session.getAccessTokenPayload(),
                lastRefreshAt: Date.now()
            });
        }
        
        console.log('✅ Session refreshed successfully');
        return session;
        
    } catch (error) {
        console.error('❌ Error refreshing session:', error);
        throw error;
    }
}

/**
 * Enhanced error handlers with better logging
 */
const errorHandlers = {
    onUnauthorised: (message, request, response) => {
        const userId = request?.session?.getUserId?.() || 'unknown';
        const userAgent = request?.get?.('user-agent') || 'unknown';
        const ip = request?.ip || request?.connection?.remoteAddress || 'unknown';
        
        console.log('❌ Session unauthorized:', {
            message,
            userId,
            userAgent,
            ip,
            timestamp: new Date().toISOString()
        });
        
        if (response && typeof response.status === 'function') {
            return response.status(401).json({
                success: false,
                message: 'Session expired or invalid. Please log in again.',
                error: 'UNAUTHORIZED',
                code: 'SESSION_EXPIRED',
                timestamp: new Date().toISOString()
            });
        }
        throw new Error('UNAUTHORIZED');
    },
    
    onTokenTheftDetected: (sessionHandle, userId, req, res) => {
        const userAgent = req?.get?.('user-agent') || 'unknown';
        const ip = req?.ip || req?.connection?.remoteAddress || 'unknown';
        
        console.log('🚨 Token theft detected:', {
            sessionHandle,
            userId,
            userAgent,
            ip,
            timestamp: new Date().toISOString()
        });
        
        // TODO: Add additional security measures like:
        // - Email notification to user
        // - Temporary account lock
        // - Security audit log
        
        if (res && typeof res.status === 'function') {
            return res.status(401).json({
                success: false,
                message: 'Security threat detected. All sessions have been terminated.',
                error: 'TOKEN_THEFT_DETECTED',
                code: 'SECURITY_BREACH',
                timestamp: new Date().toISOString()
            });
        }
        throw new Error('TOKEN_THEFT_DETECTED');
    }
};

// Main session configuration export
module.exports = Session.init({
    // Session timing configuration
    sessionLifetime: SESSION_CONFIG.LIFETIME_SECONDS,
    refreshTokenLifetime: SESSION_CONFIG.REFRESH_TOKEN_LIFETIME_SECONDS,
    sessionExpiredStatusCode: 401,
    invalidClaimStatusCode: 403,
    
    // Cookie configuration
    cookieDomain: ENVIRONMENT.IS_PRODUCTION ? ENVIRONMENT.APP_DOMAIN : undefined,
    cookieSecure: ENVIRONMENT.IS_PRODUCTION,
    cookieSameSite: ENVIRONMENT.IS_PRODUCTION ? 'strict' : 'lax',
    cookiePath: '/',
    cookieHttpOnly: true,
    cookieMaxAge: SESSION_CONFIG.COOKIE_MAX_AGE_MS,
    
    // Security configuration
    getTokenTransferMethod: () => 'cookie',
    tokenTransferMethod: 'cookie',
    antiCsrf: ENVIRONMENT.IS_PRODUCTION ? 'VIA_TOKEN' : 'NONE',
    
    // Enhanced error handling
    errorHandlers,
    
    // CORS configuration
    refreshAPICustomHeaders: getCorsHeaders,
    
    // Function overrides for enhanced functionality
    override: {
        functions: (originalImplementation) => {
            return {
                ...originalImplementation,
                
                createNewSession: async function (input) {
                    return createEnhancedSession(input, originalImplementation);
                },
                
                refreshSession: async function (input) {
                    return refreshEnhancedSession(input, originalImplementation);
                },
                
                // Override session verification for additional logging
                getSession: async function (input) {
                    try {
                        const session = await originalImplementation.getSession(input);
                        
                        // Log session access for monitoring
                        if (session && process.env.LOG_SESSION_ACCESS === 'true') {
                            console.log('📊 Session accessed:', {
                                userId: session.getUserId(),
                                sessionHandle: session.getHandle(),
                                timestamp: new Date().toISOString()
                            });
                        }
                        
                        return session;
                    } catch (error) {
                        console.error('❌ Session verification failed:', error.message);
                        throw error;
                    }
                }
            };
        }
    }
});