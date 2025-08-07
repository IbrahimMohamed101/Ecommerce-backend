const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Parse both JSON and URL-encoded bodies for this router
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Check content type middleware
const checkContentType = (req, res, next) => {
    const contentType = req.headers['content-type'];
    if (!contentType || (contentType !== 'application/json' && !contentType.includes('application/x-www-form-urlencoded'))) {
        return res.status(400).json({
            success: false,
            message: 'Content-Type must be application/json or application/x-www-form-urlencoded',
            receivedContentType: contentType || 'not set'
        });
    }
    next();
};

const adminManagementController = require('../controllers/admin/adminManagementController');
const isSuperAdmin = require('../middleware/isSuperAdmin');
const validateRequest = require('../middleware/validateRequest');
const { verifySession } = require("supertokens-node/recipe/session/framework/express");

console.log('Admin management dependencies loaded successfully');

// Log all incoming requests for debugging
router.use((req, res, next) => {
    console.log('=== Admin Management Request ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', {
        cookie: req.headers.cookie ? 'Present' : 'Missing',
        authorization: req.headers.authorization || 'Not set',
        origin: req.headers.origin || 'Not set',
        'content-type': req.headers['content-type'] || 'Not set'
    });
    next();
});

// Apply CORS headers for admin routes
router.use((req, res, next) => {
    // Get client URL from environment variables with fallback
    const clientUrl = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || 
                     process.env.WEBSITE_DOMAIN || 
                     process.env.CLIENT_URL || 
                     (process.env.NODE_ENV === 'production' ? 'https://ecommerce-backend-l7a2.onrender.com' : 'http://localhost:3000');
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', clientUrl);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-csrf-token');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Validation rules for admin creation
const createAdminValidation = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[^A-Za-z0-9]/)
        .withMessage('Password must contain at least one special character'),
    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('adminType')
        .optional()
        .isIn(['admin', 'subAdmin'])
        .withMessage('Invalid admin type')
];

// Protected route - only accessible by superAdmin
router.post(
    '/create',
    checkContentType,
    verifySession(),
    isSuperAdmin,
    (req, res, next) => {
        // Check if request body is empty
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Request body cannot be empty',
                requiredFields: ['email', 'password', 'firstName', 'lastName'],
                optionalFields: ['adminType']
            });
        }
        next();
    },
    validateRequest(createAdminValidation),
    adminManagementController.createAdmin
);

console.log('✅ Admin create route registered successfully');

module.exports = router;
