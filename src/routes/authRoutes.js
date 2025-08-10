const express = require('express');
const router = express.Router();
const { verifyEmail } = require('../controllers/auth/authController');
const { verificationSuccess, verificationError } = require('../controllers/auth/verificationController');
const { googleAuth, twitterAuth, oauthCallback } = require('../controllers/auth/socialAuthController');

// Email Verification Routes
router.get('/verify-email', verifyEmail);
router.get('/verification-success', verificationSuccess);
router.get('/verification-error', verificationError);

// Social Authentication Routes
/**
 * @route   GET /auth/google
 * @desc    Initiate Google OAuth login
 * @access  Public
 */
router.get('/google', googleAuth);

/**
 * @route   GET /auth/twitter
 * @desc    Initiate Twitter OAuth login
 * @access  Public
 */
router.get('/twitter', twitterAuth);

/**
 * @route   GET /auth/callback/google
 * @route   GET /auth/callback/twitter
 * @desc    OAuth callback URL for Google and Twitter
 * @access  Public
 */
router.get('/callback/:provider(google|twitter)', oauthCallback);

module.exports = router;
