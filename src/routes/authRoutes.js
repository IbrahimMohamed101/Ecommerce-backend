const express = require('express');
const router = express.Router();
const { verifyEmail } = require('../controllers/auth/authController');
const { verificationSuccess, verificationError } = require('../controllers/auth/verificationController');

/**
 * @route   GET /auth/verify-email
 * @desc    Verify user's email with token
 * @access  Public
 */
router.get('/verify-email', verifyEmail);

/**
 * @route   GET /auth/verification-success
 * @desc    Show success page after email verification
 * @access  Public
 */
router.get('/verification-success', verificationSuccess);

/**
 * @route   GET /auth/verification-error
 * @desc    Show error page when email verification fails
 * @access  Public
 */
router.get('/verification-error', verificationError);

module.exports = router;
