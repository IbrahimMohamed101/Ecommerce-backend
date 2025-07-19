    const supertokens = require("supertokens-node");
const Session = require("supertokens-node/recipe/session");
const User = require('../models/User');

const { verifySession } = require("supertokens-node/recipe/session/framework/express");

const verifyUser = async (req, res, next) => {
    try {
        console.log('Session data:', req.session);
        
        if (!req.session) {
            console.log('No session found in request');
            return res.status(401).json({
                success: false,
                message: 'No active session found. Please log in.'
            });
        }

        const userId = req.session.getUserId();
        console.log('Session user ID:', userId);
        
        if (!userId) {
            console.log('No user ID in session');
            return res.status(401).json({
                success: false,
                message: 'Invalid session. Please log in again.'
            });
        }

        // Get user from database using supertokensId
        const user = await User.findOne({ supertokensId: userId });
        console.log('Found user in DB:', user ? user._id : 'Not found');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Check if user account is active
        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Error in verifyUser middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        
        next();
    };
};

    const requireEmailVerification = (req, res, next) => {
    if (!req.user.isEmailVerified) {
        return res.status(403).json({
        success: false,
        message: 'Email verification required'
        });
    }
    next();
    };

    module.exports = {
    verifySession,
    verifyUser,
    requireRole,
    requireEmailVerification
    };
