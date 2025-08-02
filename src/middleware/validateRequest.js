const { validationResult } = require('express-validator');
const { BadRequestError } = require('../utils/errors');

const validateRequest = (validations) => {
    return async (req, res, next) => {
        try {
            console.log('=== Request Body ===');
            console.log(JSON.stringify(req.body, null, 2));
            
            // Run all validations
            for (let validation of validations) {
                await validation.run(req);
            }

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(error => ({
                    field: error.param,
                    message: error.msg,
                    value: error.value,
                    location: error.location
                }));

                console.log('=== Validation Errors ===');
                console.log(JSON.stringify(errorMessages, null, 2));
                
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errorMessages
                });
            }

            next();
        } catch (error) {
            console.error('Validation middleware error:', error);
            next(error);
        }
    };
};

module.exports = validateRequest; // ✅ export مباشرة للدالة
