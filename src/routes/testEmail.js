const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

/**
 * @route   GET /api/test/email
 * @desc    Test email sending
 * @access  Public
 */
router.get('/test/email', async (req, res) => {
    try {
        const testEmail = 'hemaatar8@gmail.com'; // Replace with your test email
        const testLink = 'https://yourapp.com/verify-email?token=test123';
        
        console.log('Sending test email to:', testEmail);
        const result = await emailService.sendVerificationEmail(testEmail, testLink);
        
        res.status(200).json({
            success: true,
            message: 'Test email sent successfully',
            data: {
                messageId: result.messageId,
                previewUrl: result.previewUrl
            }
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
