const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const EmailVerification = require('supertokens-node/recipe/emailverification');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const User = require('../models/User');

/**
 * @route   GET /test-email
 * @desc    Test email sending
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const testEmail = 'hemaatar8@gmail.com';
        
        // Get user by email from MongoDB
        const user = await User.findOne({ email: testEmail });
        if (!user || !user.supertokensId) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email or missing SuperTokens ID',
                email: testEmail
            });
        }

        // Generate verification token for the user
        const tokenResult = await EmailVerification.createEmailVerificationToken('public', user.id);
        if (tokenResult.status === 'EMAIL_ALREADY_VERIFIED_ERROR') {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified',
                email: testEmail
            });
        }
        
        const verificationToken = tokenResult.token;
        const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.APP_URL || 'https://ecommerce-backend-l7a2.onrender.com';
        const testLink = `${baseUrl}/verify-email?token=${verificationToken}`;
        
        console.log('🚀 Sending test email to:', testEmail);
        
        // Test the email service directly
        await emailService.sendVerificationEmail(testEmail, testLink);
        
        res.status(200).json({
            success: true,
            message: 'Test email sent successfully',
            email: testEmail
        });
    } catch (error) {
        console.error('❌ Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message
        });
    }
});

/**
 * @route   POST /test-email
 * @desc    Test email sending (POST)
 * @access  Public
 */
router.post('/', async (req, res) => {
    try {
        const { email = 'hemaatar8@gmail.com' } = req.body;
        
        // Get user by email from MongoDB
        const user = await User.findOne({ email: email });
        if (!user || !user.supertokensId) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email or missing SuperTokens ID',
                email: email
            });
        }

        // Generate verification token for the user
        const tokenResult = await EmailVerification.createEmailVerificationToken('public', user.id);
        if (tokenResult.status === 'EMAIL_ALREADY_VERIFIED_ERROR') {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified',
                email: email
            });
        }
        
        const verificationToken = tokenResult.token;
        const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.APP_URL || 'https://ecommerce-backend-l7a2.onrender.com';
        const testLink = `${baseUrl}/verify-email?token=${verificationToken}`;
        
        console.log('🚀 Sending test email to:', email);
        
        // Test the email service directly
        await emailService.sendVerificationEmail(email, testLink);
        
        res.status(200).json({
            success: true,
            message: 'Test email sent successfully',
            email: email
        });
    } catch (error) {
        console.error('❌ Test email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message
        });
    }
});

/**
 * @route   POST /test-email/verify
 * @desc    Test email verification flow
 * @access  Public
 */
router.post('/verify', async (req, res) => {
    try {
        const { email = 'hemaatar8@gmail.com' } = req.body;
        
        console.log('🔍 Looking up user with email:', email);
        
        // Get user by email from MongoDB
        const user = await User.findOne({ email: email }).lean();
        if (!user) {
            console.log('❌ User not found with email:', email);
            return res.status(404).json({
                success: false,
                message: 'User not found with this email',
                email: email
            });
        }

        if (!user.supertokensId) {
            console.log('❌ User found but missing supertokensId:', user._id);
            return res.status(400).json({
                success: false,
                message: 'User found but missing SuperTokens ID',
                email: email,
                userId: user._id
            });
        }

        console.log('🔑 Found user with supertokensId:', user.supertokensId);
        
        // Create a RecipeUserId instance
        const { RecipeUserId } = require('supertokens-node');
        const recipeUserId = new RecipeUserId(user.supertokensId);
        
        console.log('🔑 Created RecipeUserId:', recipeUserId.getAsString());
        
        // Generate verification token
        console.log('🔑 Generating email verification token...');
        const tokenResult = await EmailVerification.createEmailVerificationToken(
            'public',
            recipeUserId,
            email
        );
        
        console.log('🔑 Token generation result:', tokenResult);
        
        if (tokenResult.status === 'EMAIL_ALREADY_VERIFIED_ERROR') {
            console.log('ℹ️ Email is already verified');
            return res.status(400).json({
                success: false,
                message: 'Email is already verified',
                email: email
            });
        }
        
        if (tokenResult.status !== 'OK' || !tokenResult.token) {
            console.error('❌ Failed to generate verification token:', tokenResult);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate verification token',
                status: tokenResult.status
            });
        }
        
        const verificationToken = tokenResult.token;
        const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.APP_URL || 'https://ecommerce-backend-l7a2.onrender.com';
        const testLink = `${baseUrl}/verify-email?token=${verificationToken}`;
        
        console.log('📤 Sending verification email to:', email);
        console.log('🔗 Verification link:', testLink);
        
        // Test the email service directly
        await emailService.sendVerificationEmail(email, testLink);
        
        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully',
            email: email,
            token: verificationToken,
            link: testLink
        });
        
    } catch (error) {
        console.error('❌ Email verification test error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process email verification test',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
