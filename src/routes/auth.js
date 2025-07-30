const express = require('express');
const router = express.Router();
const { middleware } = require("supertokens-node/framework/express");
const { verifySession } = require("supertokens-node/recipe/session/framework/express");
const { verifyUser } = require('../middleware/auth');
const userController = require('../controllers/auth/userController');
const sessionController = require('../controllers/auth/sessionController');
const passwordController = require('../controllers/auth/passwordController');
const emailVerificationController = require('../controllers/auth/emailVerificationController');
const { body } = require('express-validator');

// Public routes (no session required)
router.post('/user/password/reset',
    [
        body('formFields').isArray().withMessage('Form fields array is required'),
        body('formFields.*.id').isString().withMessage('Field ID is required'),
        body('formFields.*.value').isString().withMessage('Field value is required')
    ],
    (req, res, next) => {
        console.log('Routing: POST /auth/user/password/reset');
        passwordController.requestPasswordReset(req, res, next);
    }
);

router.post('/user/password/reset/submit',
    [
        body('formFields').isArray().withMessage('Form fields array is required'),
        body('formFields.*.id').isString().withMessage('Field ID is required'),
        body('formFields.*.value').isString().withMessage('Field value is required')
    ],
    (req, res, next) => {
        console.log('Routing: POST /auth/user/password/reset/submit');
        passwordController.submitPasswordReset(req, res, next);
    }
);

// SuperTokens middleware (place after custom public routes)
router.use(middleware());

// Protected routes (require valid session)
router.get('/user/me', 
    verifySession(),
    verifyUser,
    (req, res, next) => {
        console.log('Fetching current user data for:', req.user?.email);
        next();
    }, 
    userController.getCurrentUser
);

// Logout endpoints
router.post('/user/logout', 
    verifySession(),
    verifyUser,
    (req, res, next) => {
        console.log('Logout request for user:', req.user?.email);
        next();
    }, 
    sessionController.logout
);

router.post('/user/logout/all', 
    verifySession(),
    verifyUser,
    sessionController.logoutAll
);

// Email verification
router.post('/user/email/verify/resend', 
    emailVerificationController.resendEmailVerification
);

// Update password
router.put('/user/password', 
    verifySession(),
    verifyUser,
    [
        body('currentPassword').isLength({ min: 6 }).withMessage('Current password is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    ],
    passwordController.updatePassword
);

// Delete account
router.delete('/user/account', 
    verifySession(),
    verifyUser,
    [
        body('password').isLength({ min: 6 }).withMessage('Password is required for account deletion')
    ],
    userController.deleteAccount
);

// Admin password reset
router.post('/admin/reset-password',
    verifySession(),
    verifyUser,
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    ],
    (req, res, next) => {
        if (!req.user?.roles?.includes('admin')) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Admin access required',
                code: 'UNAUTHORIZED'
            });
        }
        next();
    },
    passwordController.adminResetPassword
);

// Session management endpoints
router.get('/user/sessions', 
    verifySession(),
    verifyUser, 
    (req, res, next) => {
        console.log('Fetching active sessions for user:', req.user?.email);
        next();
    },
    sessionController.getActiveSessions
);

// NEW ENDPOINT - Session statistics
router.get('/user/sessions/stats', 
    verifySession(),
    verifyUser,
    (req, res, next) => {
        console.log('Fetching session statistics for user:', req.user?.email);
        next();
    },
    sessionController.getSessionStats
);

router.delete('/user/sessions/:sessionHandle', 
    verifySession(),
    verifyUser,
    (req, res, next) => {
        // If sessionHandle is not in params but is in query, use that
        if (!req.params.sessionHandle && req.query.sessionHandle) {
            req.params.sessionHandle = req.query.sessionHandle;
        }
        console.log('Revoking session:', req.params.sessionHandle, 'for user:', req.user?.email);
        next();
    },
    sessionController.revokeSession
);

// Alternative route with query parameter for better compatibility
router.delete('/user/sessions', 
    verifySession(),
    verifyUser,
    (req, res, next) => {
        if (!req.query.sessionHandle) {
            return res.status(400).json({
                success: false,
                message: 'Session handle is required',
                code: 'SESSION_HANDLE_REQUIRED'
            });
        }
        req.params = req.params || {};
        req.params.sessionHandle = req.query.sessionHandle;
        console.log('Revoking session (query param):', req.params.sessionHandle, 'for user:', req.user?.email);
        next();
    },
    sessionController.revokeSession
);

// Update profile - supports both PATCH and PUT
const updateProfileMiddleware = [
    verifySession(),
    verifyUser,
    [
        body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        body('email').optional().isEmail().withMessage('Please provide a valid email'),
        body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
        body('avatar').optional().isURL().withMessage('Please provide a valid URL for the avatar'),
        body('address').optional().trim().isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
        // Keep the original validation for backward compatibility
        body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
        body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    ],
    (req, res, next) => {
        console.log('Updating profile for user:', req.user?.email);
        // Map the name to firstName and lastName if not provided separately
        if (req.body.name && !req.body.firstName) {
            const nameParts = req.body.name.trim().split(' ');
            req.body.firstName = nameParts[0];
            req.body.lastName = nameParts.slice(1).join(' ') || ' ';
        }
        next();
    },
    require('../controllers/auth/profileController').updateProfile
];

// Support both PUT and PATCH methods for profile updates
router.put('/user/profile', ...updateProfileMiddleware);
router.patch('/user/profile', ...updateProfileMiddleware);

// Keep the original route with /auth prefix for backward compatibility
router.put('/auth/user/profile', ...updateProfileMiddleware);
router.patch('/auth/user/profile', ...updateProfileMiddleware);


// Address management
router.post('/user/addresses',
    verifySession(),
    verifyUser,
    [
        body('firstName').trim().isLength({ min: 2 }).withMessage('First name is required'),
        body('lastName').trim().isLength({ min: 2 }).withMessage('Last name is required'),
        body('street').trim().isLength({ min: 5 }).withMessage('Street address is required'),
        body('city').trim().isLength({ min: 2 }).withMessage('City is required'),
        body('state').trim().isLength({ min: 2 }).withMessage('State is required'),
        body('zipCode').trim().isLength({ min: 5 }).withMessage('ZIP code is required'),
        body('phone').isMobilePhone().withMessage('Valid phone number is required')
    ],
    require('../controllers/auth/profileController').addAddress
);

router.put('/user/addresses/:addressId',
    verifySession(),
    verifyUser,
    [
        body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
        body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
        body('street').optional().trim().isLength({ min: 5 }).withMessage('Street address is required'),
        body('city').optional().trim().isLength({ min: 2 }).withMessage('City is required'),
        body('state').optional().trim().isLength({ min: 2 }).withMessage('State is required'),
        body('zipCode').optional().trim().isLength({ min: 5 }).withMessage('ZIP code is required'),
        body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
    ],
    require('../controllers/auth/profileController').updateAddress
);

router.delete('/user/addresses/:addressId',
    verifySession(),
    verifyUser,
    require('../controllers/auth/profileController').deleteAddress
);

// User preferences
router.put('/user/preferences',
    verifySession(),
    verifyUser,
    [
        body('language').optional().isIn(['ar', 'en']).withMessage('Invalid language'),
        body('currency').optional().isIn(['EGP', 'USD', 'EUR']).withMessage('Invalid currency'),
        body('theme').optional().isIn(['light', 'dark', 'system']).withMessage('Invalid theme preference'),
        body('notifications').optional().isObject().withMessage('Invalid notifications settings')
    ],
    require('../controllers/auth/profileController').updatePreferences
);

module.exports = router;