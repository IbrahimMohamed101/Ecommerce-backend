const { verifySession } = require("supertokens-node/recipe/session/framework/express");
const User = require('../models/User');

/**
 * Middleware to verify if user has specific permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware function
 */
const authorize = (permission) => {
    return [
        verifySession(),
        async (req, res, next) => {
            try {
                // Get user from DB using supertokensId
                const userId = req.session.getUserId();
                const user = await User.findOne({ supertokensId: userId });
                
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found.'
                    });
                }

                // Check if user has the required permission
                const hasPermission = await user.hasPermission(permission);
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: 'You do not have permission to perform this action.'
                    });
                }

                // Attach user to request object
                req.user = user;
                next();
            } catch (error) {
                console.error('Authorization error:', error);
                res.status(500).json({
                    success: false,
                    message: 'An error occurred during authorization.'
                });
            }
        }
    ];
};

module.exports = {
    authorize
};
