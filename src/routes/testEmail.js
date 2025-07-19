const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

/**
 * @route   GET /api/test-email
 * @desc    Test email sending
 * @access  Public
 */
router.get('/test-email', async (req, res, next) => {
    try {
        const testEmail = process.env.TEST_EMAIL || 'test@example.com';
        
        await emailService.sendEmail({
            to: testEmail,
            subject: 'Test Email from E-commerce Backend',
            html: `
                <h1>Test Email</h1>
                <p>This is a test email from the E-commerce Backend.</p>
                <p>Time: ${new Date().toISOString()}</p>
            `
        });

        res.status(200).json({
            success: true,
            message: 'Test email sent successfully',
            email: testEmail
        });
    } catch (error) {
        logger.error('Test email error:', error);
        next(error);
    }
});

module.exports = router;
