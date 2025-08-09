const { body } = require('express-validator');

exports.updatePreferences = [
    body('language').optional().isIn(['ar', 'en']).withMessage('Invalid language'),
    body('currency').optional().isIn(['EGP', 'USD', 'EUR']).withMessage('Invalid currency'),
    body('theme').optional().isIn(['light', 'dark', 'system']).withMessage('Invalid theme preference'),
    body('notifications').optional().isObject().withMessage('Invalid notifications settings')
];
