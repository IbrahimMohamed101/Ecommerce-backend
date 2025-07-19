    const { body, validationResult } = require('express-validator');

    const validateSignup = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
        .trim()
        .isLength({ min: 2 })
        .withMessage('First name must be at least 2 characters'),
    body('lastName')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Last name must be at least 2 characters'),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Invalid phone number')
    ];

    const validateSignin = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password is required')
    ];

    const validatePasswordReset = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail()
    ];

    const validatePasswordUpdate = [
    body('currentPassword')
        .isLength({ min: 6 })
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
    ];

    const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
        });
    }
    next();
    };

    module.exports = {
    validateSignup,
    validateSignin,
    validatePasswordReset,
    validatePasswordUpdate,
    handleValidationErrors
    };
