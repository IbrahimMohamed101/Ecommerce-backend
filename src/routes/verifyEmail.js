const express = require('express');
const router = express.Router();
const supertokens = require('supertokens-node');
const EmailVerification = require('supertokens-node/recipe/emailverification');

// Handle email verification
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required',
                verified: false
            });
        }

        console.log('🔍 Verifying email token...');
        
        // Verify the token using SuperTokens
        const response = await EmailVerification.verifyEmailUsingToken('public', token);
        
        if (response.status === 'OK') {
            console.log('✅ Email verified successfully for user:', response.user);
            
            // Update user's email verification status in the database
            try {
                const User = require('../models/User');
                await User.findOneAndUpdate(
                    { supertokensId: response.user.recipeUserId.getAsString() },
                    { 
                        isEmailVerified: true,
                        'activityLog.emailVerifiedAt': new Date()
                    }
                );
                console.log('✅ Updated user email verification status in database');
            } catch (dbError) {
                console.error('❌ Error updating user verification status:', dbError);
                // Continue even if database update fails
            }
            
            return res.json({
                success: true,
                message: 'Email verified successfully',
                verified: true,
                userId: response.user
            });
        } else {
            console.log('❌ Email verification failed:', response);
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token',
                verified: false
            });
        }
    } catch (error) {
        console.error('❌ Email verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during email verification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            verified: false
        });
    }
});

module.exports = router;
