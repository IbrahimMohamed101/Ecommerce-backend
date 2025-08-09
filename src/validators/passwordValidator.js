const { body } = require('express-validator');

exports.resetPasswordRequest = [
    body('formFields').isArray().withMessage('Form fields array is required'),
    body('formFields.*.id').isString().withMessage('Field ID is required'),
    body('formFields.*.value').isString().withMessage('Field value is required')
];

exports.resetPasswordSubmit = [
    body('formFields').isArray().withMessage('Form fields array is required'),
    body('formFields.*.id').isString().withMessage('Field ID is required'),
    body('formFields.*.value').isString().withMessage('Field value is required')
];

exports.updatePassword = [
    body('currentPassword').isLength({ min: 6 }).withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

exports.adminResetPassword = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];
