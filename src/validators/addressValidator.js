const { body } = require('express-validator');

exports.addAddress = [
    body('firstName').trim().isLength({ min: 2 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Last name is required'),
    body('street').trim().isLength({ min: 5 }).withMessage('Street address is required'),
    body('city').trim().isLength({ min: 2 }).withMessage('City is required'),
    body('state').trim().isLength({ min: 2 }).withMessage('State is required'),
    body('zipCode').trim().isLength({ min: 5 }).withMessage('ZIP code is required'),
    body('phone').isMobilePhone().withMessage('Valid phone number is required')
];

exports.updateAddress = [
    body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('street').optional().trim().isLength({ min: 5 }).withMessage('Street address is required'),
    body('city').optional().trim().isLength({ min: 2 }).withMessage('City is required'),
    body('state').optional().trim().isLength({ min: 2 }).withMessage('State is required'),
    body('zipCode').optional().trim().isLength({ min: 5 }).withMessage('ZIP code is required'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
];
