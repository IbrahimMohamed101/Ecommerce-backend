    const Session = require("supertokens-node/recipe/session");

    // Constants for better maintainability
    const SESSION_CONFIG = {
        DEFAULT_EXPIRY_DAYS: 7,
        DEFAULT_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000
    };

    const ERROR_CODES = {
        LOGOUT_ERROR: 'LOGOUT_ERROR',
        LOGOUT_ALL_ERROR: 'LOGOUT_ALL_ERROR', 
        SESSION_FETCH_ERROR: 'SESSION_FETCH_ERROR',
        SESSION_HANDLE_REQUIRED: 'SESSION_HANDLE_REQUIRED',
        REVOKE_SESSION_ERROR: 'REVOKE_SESSION_ERROR'
    };

    class SessionController {
    constructor() {
        // Bind all methods to ensure proper 'this' context
        this.logout = this.logout.bind(this);
        this.logoutAll = this.logoutAll.bind(this);
        this.getActiveSessions = this.getActiveSessions.bind(this);
        this.revokeSession = this.revokeSession.bind(this);
        this.getSessionStats = this.getSessionStats.bind(this);
        this._getSessionDetails = this._getSessionDetails.bind(this);
        this._calculateSessionTimes = this._calculateSessionTimes.bind(this);
        this._extractDeviceInfo = this._extractDeviceInfo.bind(this);
        this._extractClientIP = this._extractClientIP.bind(this);
        this._handleError = this._handleError.bind(this);
    }
        /**
         * Logout current session
         */
        async logout(req, res) {
            try {
                const sessionHandle = req.session.getHandle();
                await Session.revokeSession(sessionHandle);
                
                return res.json({
                    success: true,
                    message: 'Logged out successfully'
                });
            } catch (error) {
                console.error('Error in logout:', error);
                return this._handleError(res, 'Error logging out', ERROR_CODES.LOGOUT_ERROR, 500);
            }
        }

        /**
         * Logout from all devices
         */
        async logoutAll(req, res) {
            try {
                const userId = req.session.getUserId();
                await Session.revokeAllSessionsForUser(userId);
                
                return res.json({
                    success: true,
                    message: 'Logged out from all devices successfully'
                });
            } catch (error) {
                console.error('Error in logoutAll:', error);
                return this._handleError(res, 'Error logging out from all devices', ERROR_CODES.LOGOUT_ALL_ERROR, 500);
            }
        }

        /**
         * Get all active sessions for current user
         */
        async getActiveSessions(req, res) {
            try {
                const userId = req.session.getUserId();
                const currentSessionHandle = req.session.getHandle();
                
                console.log('Fetching active sessions for user:', userId);
                
                const sessionHandles = await Session.getAllSessionHandlesForUser(userId);
                console.log(`Found ${sessionHandles.length} active sessions`);
                
                // Process sessions in parallel for better performance
                const sessionDetails = await Promise.allSettled(
                    sessionHandles.map(handle => this._getSessionDetails(handle, currentSessionHandle, req))
                );
                
                // Filter successful results and sort by last active
                const validSessions = sessionDetails
                    .filter(result => result.status === 'fulfilled' && result.value !== null)
                    .map(result => result.value)
                    .sort((a, b) => b.lastActive - a.lastActive);
                
                console.log(`Returning ${validSessions.length} valid sessions`);
                
                return res.json({
                    success: true,
                    data: validSessions,
                    meta: {
                        totalSessions: validSessions.length,
                        currentSessionHandle
                    }
                });
            } catch (error) {
                console.error('Error in getActiveSessions:', error);
                return this._handleError(res, 'Error fetching active sessions', ERROR_CODES.SESSION_FETCH_ERROR, 500);
            }
        }

        /**
         * Revoke specific session by handle
         */
        async revokeSession(req, res) {
            try {
                const { sessionHandle } = req.params;
                
                if (!sessionHandle?.trim()) {
                    return this._handleError(res, 'Session handle is required', ERROR_CODES.SESSION_HANDLE_REQUIRED, 400);
                }

                // Prevent users from revoking their current session via this endpoint
                const currentSessionHandle = req.session.getHandle();
                if (sessionHandle === currentSessionHandle) {
                    return this._handleError(res, 'Use logout endpoint to revoke current session', 'CURRENT_SESSION_REVOKE_FORBIDDEN', 400);
                }

                await Session.revokeSession(sessionHandle);
                
                return res.json({
                    success: true,
                    message: 'Session revoked successfully',
                    revokedSessionHandle: sessionHandle
                });
            } catch (error) {
                console.error('Error in revokeSession:', error);
                return this._handleError(res, 'Error revoking session', ERROR_CODES.REVOKE_SESSION_ERROR, 500);
            }
        }

        /**
         * Get session statistics
         */
        async getSessionStats(req, res) {
            try {
                const userId = req.session.getUserId();
                const sessionHandles = await Session.getAllSessionHandlesForUser(userId);
                
                const stats = {
                    totalActiveSessions: sessionHandles.length,
                    currentSessionHandle: req.session.getHandle(),
                    userId
                };

                return res.json({
                    success: true,
                    data: stats
                });
            } catch (error) {
                console.error('Error in getSessionStats:', error);
                return this._handleError(res, 'Error fetching session statistics', 'SESSION_STATS_ERROR', 500);
            }
        }

        // Private helper methods

        /**
         * Extract session details from session handle
         */
        async _getSessionDetails(handle, currentSessionHandle, req) {
            try {
                const sessionInfo = await Session.getSessionInformation(handle);
                if (!sessionInfo) {
                    console.warn(`No session information found for handle: ${handle}`);
                    return null;
                }
                
                const deviceInfo = this._extractDeviceInfo(req.headers['user-agent']);
                const ip = this._extractClientIP(req);
                const timeData = this._calculateSessionTimes(sessionInfo);
                
                return {
                    handle,
                    createdAt: new Date(sessionInfo.timeCreated),
                    lastActive: timeData.lastActive,
                    expiresAt: timeData.expiresAt,
                    deviceInfo: sessionInfo.accessTokenPayload?.deviceInfo || deviceInfo,
                    ip: sessionInfo.accessTokenPayload?.ip || ip,
                    isCurrent: handle === currentSessionHandle,
                    // Additional useful info
                    isExpired: timeData.isExpired,
                    timeUntilExpiry: timeData.timeUntilExpiry
                };
            } catch (error) {
                console.error(`Error getting session info for handle ${handle}:`, error);
                return null;
            }
        }

        /**
         * Calculate session timing information
         */
        _calculateSessionTimes(sessionInfo) {
            const now = new Date();
            
            // Calculate last active time
            const lastActive = sessionInfo.accessTokenPayload?.iat 
                ? new Date(sessionInfo.accessTokenPayload.iat * 1000)
                : new Date(sessionInfo.timeCreated);
            
            // Calculate expiry time
            const sessionExpiryMs = sessionInfo.sessionExpiryInSeconds 
                ? sessionInfo.sessionExpiryInSeconds * 1000 
                : SESSION_CONFIG.DEFAULT_EXPIRY_MS;
                
            const expiresAt = new Date(Number(sessionInfo.timeCreated) + sessionExpiryMs);
            
            // Additional timing calculations
            const isExpired = now > expiresAt;
            const timeUntilExpiry = Math.max(0, expiresAt.getTime() - now.getTime());
            
            return {
                lastActive,
                expiresAt,
                isExpired,
                timeUntilExpiry
            };
        }

        /**
         * Extract device information from user agent
         */
        _extractDeviceInfo(userAgent = '') {
            if (!userAgent || userAgent === 'Unknown') return 'Unknown Device';
            
            // Mobile devices
            if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
                const mobileMatch = userAgent.match(/\(([^)]+)\)/);
                return mobileMatch?.[1] || 'Mobile Device';
            }
            
            // Desktop operating systems
            if (userAgent.includes('Windows NT')) {
                const version = userAgent.match(/Windows NT ([\d.]+)/)?.[1];
                return version ? `Windows ${version}` : 'Windows PC';
            }
            
            if (userAgent.includes('Mac OS X')) {
                const version = userAgent.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.');
                return version ? `macOS ${version}` : 'Mac';
            }
            
            if (userAgent.includes('Linux')) {
                return userAgent.includes('Ubuntu') ? 'Ubuntu Linux' : 'Linux';
            }
            
            // Browsers
            if (userAgent.includes('Chrome')) return 'Chrome Browser';
            if (userAgent.includes('Firefox')) return 'Firefox Browser';
            if (userAgent.includes('Safari')) return 'Safari Browser';
            if (userAgent.includes('Edge')) return 'Edge Browser';
            
            return 'Unknown Device';
        }

        /**
         * Extract client IP address
         */
        _extractClientIP(req) {
            return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                req.headers['x-real-ip'] || 
                req.connection?.remoteAddress || 
                req.socket?.remoteAddress ||
                'Unknown';
        }

        /**
         * Standardized error response handler
         */
        _handleError(res, message, code, statusCode = 500) {
            return res.status(statusCode).json({
                success: false,
                message,
                code,
                timestamp: new Date().toISOString()
            });
        }
    }

    module.exports = new SessionController();