const User = require('../models/User');
const Role = require('../models/Role');
const { ForbiddenError, UnauthorizedError } = require('../utils/errors');
const { verifySession } = require('supertokens-node/recipe/session/framework/express');

const isSuperAdmin = async (req, res, next) => {
    try {
        // First verify the session
        await new Promise((resolve, reject) => {
            verifySession()(req, res, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        
        // If we get here, the session is valid
        const session = req.session;
        
        if (!session) {
            throw new UnauthorizedError('No active session found. Please log in.');
        }

        // Get the user ID from the session
        const userId = session.getUserId();
        console.log('Authenticated User ID:', userId);
        
        if (!userId) {
            throw new UnauthorizedError('User not authenticated');
        }

        // Find the user with their role
        const user = await User.findOne({ supertokensId: userId })
            .populate('role', 'name')
            .lean();

        // Check if user exists and has the superAdmin role
        if (!user) {
            console.error(`User with ID ${userId} not found in database`);
            throw new UnauthorizedError('User not found');
        }

        if (!user.role) {
            console.error(`User ${user.email} has no role assigned`);
            throw new ForbiddenError('No role assigned to user');
        }

        if (user.role.name !== 'superAdmin') {
            console.error(`User ${user.email} does not have superAdmin role (has: ${user.role.name})`);
            throw new ForbiddenError('Access denied. Super admin privileges required.');
        }

        console.log(`User ${user.email} authenticated as super admin`);
        
        // Attach user to request for further use
        req.user = user;
        next();
    } catch (error) {
        console.error('SuperAdmin Middleware Error:', {
            message: error.message,
            stack: error.stack,
            method: req.method,
            path: req.path,
            headers: {
                cookie: req.headers.cookie ? 'Present' : 'Missing',
                authorization: req.headers.authorization || 'Not set',
                origin: req.headers.origin || 'Not set'
            }
        });
        next(error);
    }
};

module.exports = isSuperAdmin;
