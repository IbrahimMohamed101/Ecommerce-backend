const express = require('express');
const router = express.Router();
const VerificationController = require('../controllers/validation/verificationController');

/**
 * @route   GET /verify-email
 * @desc    Verify user's email using the verification token
 * @access  Public
 */
router.get('/verify-email', VerificationController.verifyEmail);

module.exports = router;
