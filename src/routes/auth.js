const express = require('express');
const router = express.Router();
const { middleware } = require("supertokens-node/framework/express");
const { verifySession } = require("supertokens-node/recipe/session/framework/express");
const { verifyUser } = require('../middleware/auth');

const userController = require('../controllers/auth/userController');
const sessionController = require('../controllers/auth/sessionController');
const passwordController = require('../controllers/auth/passwordController');
const emailVerificationController = require('../controllers/auth/emailVerificationController');
const profileController = require('../controllers/auth/profileController');


const passwordValidator = require('../validators/passwordValidator');
const profileValidator = require('../validators/profileValidator');
const addressValidator = require('../validators/addressValidator');
const preferencesValidator = require('../validators/preferencesValidator');


// Public routes
router.post('/user/password/reset', passwordValidator.resetPasswordRequest, passwordController.requestPasswordReset);
router.post('/user/password/reset/submit', passwordValidator.resetPasswordSubmit, passwordController.submitPasswordReset);

// SuperTokens middleware
router.use(middleware());

// Protected routes
router.get('/user/me', verifySession(), verifyUser, userController.getCurrentUser);

router.post('/user/logout', verifySession(), verifyUser, sessionController.logout);
router.post('/user/logout/all', verifySession(), verifyUser, sessionController.logoutAll);

router.post('/user/email/verify/resend', emailVerificationController.resendEmailVerification);

router.put('/user/password', verifySession(), verifyUser, passwordValidator.updatePassword, passwordController.updatePassword);

router.delete('/user/account', verifySession(), verifyUser, [
    require('express-validator').body('password').isLength({ min: 6 }).withMessage('Password is required for account deletion')
], userController.deleteAccount);

router.post('/admin/reset-password', verifySession(), verifyUser, passwordValidator.adminResetPassword, passwordController.adminResetPassword);

router.get('/user/sessions', verifySession(), verifyUser, sessionController.getActiveSessions);
router.get('/user/sessions/stats', verifySession(), verifyUser, sessionController.getSessionStats);
router.delete('/user/sessions/:sessionHandle', verifySession(), verifyUser, sessionController.revokeSession);

// Profile
router.put('/user/profile', verifySession(), verifyUser, profileValidator.updateProfile, profileController.updateProfile);
router.patch('/user/profile', verifySession(), verifyUser, profileValidator.updateProfile, profileController.updateProfile);

// Addresses
router.post('/user/addresses', verifySession(), verifyUser, addressValidator.addAddress, profileController.addAddress);
router.put('/user/addresses/:addressId', verifySession(), verifyUser, addressValidator.updateAddress, profileController.updateAddress);
router.delete('/user/addresses/:addressId', verifySession(), verifyUser, profileController.deleteAddress);

// Preferences
router.put('/user/preferences', verifySession(), verifyUser, preferencesValidator.updatePreferences, profileController.updatePreferences);

module.exports = router;
