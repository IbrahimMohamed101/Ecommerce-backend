const EmailVerification = require("supertokens-node/recipe/emailverification");
const EmailPassword = require("supertokens-node/recipe/emailpassword");
const Session = require("supertokens-node/recipe/session");
const supertokens = require("supertokens-node");
const { RecipeUserId } = supertokens;
const emailService = require('../../services/emailService');
const User = require('../../models/User');

class EmailVerificationController {
    // Middleware function to handle session verification for email verification endpoints
    static async verifySessionForEmailVerification(req, res, next) {
        try {
            console.log('🔐 Email verification session middleware started');
            
            // Try to get session without email verification claim validation
            const session = await Session.getSession(req, res, {
                sessionRequired: true,
                overrideGlobalClaimValidators: (globalClaimValidators) => {
                    console.log('🔧 Filtering out email verification claim validator');
                    // Filter out email verification claim validator for this endpoint
                    return globalClaimValidators.filter(validator => 
                        validator.id !== EmailVerification.EmailVerificationClaim.key
                    );
                }
            });
            
            console.log('✅ Session verified for email verification endpoint');
            req.session = session; // Attach session to request
            next();
        } catch (error) {
            console.log('❌ Session verification failed:', error.message);
            console.log('Error type:', error.type);
            
            // Handle specific SuperTokens errors
            if (error.type === Session.Error.TRY_REFRESH_TOKEN) {
                return res.status(401).json({
                    success: false,
                    message: 'Access token expired. Please refresh your session.',
                    code: 'TRY_REFRESH_TOKEN'
                });
            }
            
            if (error.type === Session.Error.UNAUTHORISED) {
                return res.status(401).json({
                    success: false,
                    message: 'No valid session found. Please login again.',
                    code: 'UNAUTHORISED'
                });
            }
            
            if (error.type === Session.Error.INVALID_CLAIMS) {
                return res.status(403).json({
                    success: false,
                    message: 'Session claims validation failed',
                    code: 'INVALID_CLAIMS',
                    claimValidationErrors: error.payload || []
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'Session verification error: ' + error.message,
                code: 'SESSION_ERROR'
            });
        }
    }

    async resendEmailVerification(req, res) {
        try {
            const { email } = req.body;

            // Validate email input
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide an email in the request body'
                });
            }

            // Find the user in your MongoDB database
            const dbUser = await User.findOne({ email: email }).exec();
            if (!dbUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if user has a SuperTokens ID
            if (!dbUser.supertokensId) {
                return res.status(400).json({
                    success: false,
                    message: 'User is not properly registered with the authentication system'
                });
            }

            const userId = dbUser.supertokensId;
            
            console.log(`📧 Creating email verification token for user: ${userId}, email: ${email}`);

            try {
                // Create a RecipeUserId instance from the user ID string
                const recipeUserId = new RecipeUserId(userId);
                
                // Create email verification token with the RecipeUserId
                const result = await EmailVerification.createEmailVerificationToken(
                    'public', // tenantId
                    recipeUserId,
                    email
                );

                // Handle the response from SuperTokens
                if (result.status === 'OK') {
                    console.log(`✅ Verification email sent to ${email}`);
                    return res.json({
                        success: true,
                        message: 'Verification email sent successfully.'
                    });
                } else if (result.status === 'EMAIL_ALREADY_VERIFIED_ERROR') {
                    console.log(`ℹ️ Email ${email} is already verified`);
                    return res.json({
                        success: true,
                        message: 'Email is already verified.'
                    });
                } else {
                    console.error(`❌ Failed to send verification email: ${result.status}`);
                    return res.status(400).json({
                        success: false,
                        message: `Failed to send email: ${result.status}`
                    });
                }
            } catch (stError) {
                console.error('SuperTokens API Error:', stError);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing verification request',
                    error: process.env.NODE_ENV === 'development' ? stError.message : undefined
                });
            }
        } catch (err) {
            console.error('Error in resendEmailVerification:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
}

module.exports = new EmailVerificationController();