const { body } = require('express-validator');

exports.updateProfile = [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('avatar').optional().isURL().withMessage('Please provide a valid URL for the avatar'),
    body('address').optional().trim().isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
    body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
];
