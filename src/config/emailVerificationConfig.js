const EmailVerification = require("supertokens-node/recipe/emailverification");
const emailService = require('../services/emailService');
const User = require('../models/User');
const logger = require('../utils/logger');

// Create a function to send verification email
async function sendVerificationEmail(user, email, emailVerifyLink) {
    try {
        logger.info('📧 Sending verification email', {
            to: email,
            userId: user.id,
            linkProvided: !!emailVerifyLink
        });

        // Use explicit production URL in production environment
        const productionUrl = process.env.NODE_ENV === 'production'
            ? 'https://ecommerce-backend-l7a2.onrender.com'
            : (process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.APP_URL || 'http://localhost:3000');
        
        // Ensure no double slashes in the URL
        const basePath = (process.env.NEXT_PUBLIC_WEBSITE_BASE_PATH || '').replace(/^\/+|\/+$/g, '');
        const pathPrefix = basePath ? `/${basePath}` : '';
        let verificationLink = '';
        
        // Log the environment for debugging
        logger.info('🔧 Environment configuration', {
            nodeEnv: process.env.NODE_ENV,
            websiteDomain: process.env.WEBSITE_DOMAIN,
            appUrl: process.env.APP_URL,
            apiDomain: process.env.API_DOMAIN,
            usingProductionUrl: productionUrl
        });
        
        // Always extract token from the original link if it exists
        const token = emailVerifyLink && emailVerifyLink.includes('?token=') 
            ? emailVerifyLink.split('?token=')[1].split('&')[0] 
            : null;

        // Always generate a new verification link using the production URL
        if (token) {
            verificationLink = `${productionUrl}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
            
            logger.info('🔗 Generated new verification link', {
                originalLink: emailVerifyLink,
                newLink: verificationLink,
                usingProductionDomain: productionUrl
            });
        } else {
            // Fallback if no token is available
            verificationLink = `${productionUrl}/auth/verify-email?email=${encodeURIComponent(email)}`;
            logger.warn('No token found in emailVerifyLink, using fallback URL', {
                email: email.substring(0, 3) + '***@' + email.split('@')[1]
            });
        }

        logger.info('🔗 Final verification link prepared', {
            hasLink: !!verificationLink,
            email: email.substring(0, 3) + '***@' + email.split('@')[1]
        });

        // Use the custom email service to send the verification link
        const result = await emailService.sendVerificationEmail(email, verificationLink);
        
        logger.info('✅ Verification email sent successfully', {
            messageId: result.messageId,
            to: email.substring(0, 3) + '***@' + email.split('@')[1]
        });
        
        return { status: 'OK' };
    } catch (error) {
        logger.error('❌ Failed to send verification email:', {
            error: error.message,
            stack: error.stack,
            to: email.substring(0, 3) + '***@' + email.split('@')[1]
        });
        // Return OK to prevent blocking the user registration
        return { status: 'OK' };
    }
}

module.exports = EmailVerification.init({
    // Set to "REQUIRED" if email verification should be mandatory
    mode: "OPTIONAL",

    // Customize email delivery
    emailDelivery: {
        override: (originalImplementation) => {
            return {
                ...originalImplementation,
                sendEmail: async (input) => {
                    logger.info('📨 Email delivery override called', {
                        type: input.type,
                        userEmail: input.user?.email,
                        hasLink: !!input.emailVerifyLink
                    });

                    // Handle email verification emails
                    if (input.type === "EMAIL_VERIFICATION") {
                        return sendVerificationEmail(
                            input.user,
                            input.user.email,
                            input.emailVerifyLink
                        );
                    }
                    
                    // For other email types, use the original implementation
                    logger.info('Using original implementation for email type:', input.type);
                    return originalImplementation.sendEmail(input);
                }
            };
        }
    },

    // Customize API behavior for email verification
    override: {
        apis: (originalImplementation) => {
            return {
                ...originalImplementation,

                // Handle email verification request
                verifyEmailPOST: async function (input) {
                    logger.info('🔄 Email verification POST request received', {
                        userId: input.session?.getUserId(),
                        hasToken: !!input.formFields?.find(f => f.id === 'token')?.value
                    });

                    const response = await originalImplementation.verifyEmailPOST(input);
                    
                    logger.info('📝 Email verification response:', {
                        status: response.status,
                        userId: input.session?.getUserId()
                    });

                    if (response.status === "OK") {
                        try {
                            logger.info('✅ Email verified successfully, updating database');
                            
                            // Update verification status in the database
                            const updatedUser = await User.findOneAndUpdate(
                                { supertokensId: input.session.getUserId() },
                                { 
                                    isEmailVerified: true,
                                    'activityLog.emailVerifiedAt': new Date()
                                },
                                { new: true }
                            );

                            if (updatedUser) {
                                logger.info('✅ Database updated for verified user:', {
                                    userId: updatedUser.supertokensId,
                                    email: updatedUser.email.substring(0, 3) + '***@' + updatedUser.email.split('@')[1]
                                });
                            } else {
                                logger.warn('⚠️ User not found in database for verification update:', {
                                    supertokensId: input.session.getUserId()
                                });
                            }
                        } catch (dbError) {
                            logger.error('❌ Failed to update database after email verification:', {
                                error: dbError.message,
                                userId: input.session?.getUserId()
                            });
                            // Don't fail the verification process if DB update fails
                        }
                    }

                    return response;
                },

                // Handle email verification token generation
                generateEmailVerifyTokenPOST: async function (input) {
                    const userId = input.session?.getUserId();
                    
                    logger.info('🔄 Generating email verification token', {
                        userId: userId,
                        hasSession: !!input.session
                    });

                    try {
                        const response = await originalImplementation.generateEmailVerifyTokenPOST(input);
                        
                        logger.info('📝 Token generation response:', {
                            status: response.status,
                            userId: userId,
                            hasToken: !!(response.status === 'OK')
                        });

                        return response;
                    } catch (error) {
                        logger.error('❌ Failed to generate email verification token:', {
                            error: error.message,
                            userId: userId
                        });
                        throw error;
                    }
                },

                // Handle checking if email is verified
                isEmailVerifiedGET: async function (input) {
                    const userId = input.session?.getUserId();
                    
                    logger.debug('🔍 Checking email verification status', {
                        userId: userId
                    });

                    const response = await originalImplementation.isEmailVerifiedGET(input);
                    
                    logger.debug('📝 Email verification status:', {
                        status: response.status,
                        isVerified: response.isVerified,
                        userId: userId
                    });

                    return response;
                }
            };
        }
    }
});