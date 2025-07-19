const EmailVerification = require("supertokens-node/recipe/emailverification");
const emailService = require('../services/emailService');
const User = require('../models/User');

module.exports = EmailVerification.init({
    mode: "REQUIRED",
    emailDelivery: {
        override: (originalImplementation) => {
            return {
                ...originalImplementation,
                sendEmail: async (input) => {
                    try {
                        console.log('📧 EmailVerification: Would send verification email to:', input.user.email);
                        console.log('🔗 EmailVerification: Verification link:', input.emailVerifyLink);
                        
                        if (process.env.NODE_ENV !== 'production') {
                            console.log('🔐 DEVELOPMENT MODE: Email verification link (not actually sent):');
                            console.log('   ', input.emailVerifyLink);
                            return { status: 'OK' };
                        }
                        
                        const result = await emailService.sendVerificationEmail(
                            input.user.email,
                            input.emailVerifyLink
                        );
                        
                        console.log('✅ EmailVerification: Email sent successfully');
                        return result;
                    } catch (error) {
                        console.error('❌ EmailVerification: Failed to send verification email:', error);
                        throw error;
                    }
                }
            };
        }
    },
    override: {
        apis: (originalImplementation) => {
            return {
                ...originalImplementation,
                verifyEmailPOST: async function (input) {
                    console.log('🔄 Email verification POST request received');
                    const response = await originalImplementation.verifyEmailPOST(input);
                    
                    if (response.status === "OK") {
                        console.log('✅ Email verified successfully, updating database');
                        await User.findOneAndUpdate(
                            { supertokensId: input.session.getUserId() },
                            { 
                                isEmailVerified: true,
                                'activityLog.emailVerifiedAt': new Date()
                            }
                        );
                    }
                    
                    return response;
                },
                generateEmailVerifyTokenPOST: async function (input) {
                    console.log('🔄 Generating email verification token for user:', input.session.getUserId());
                    const response = await originalImplementation.generateEmailVerifyTokenPOST(input);
                    console.log('📝 Token generation response:', response);
                    return response;
                }
            };
        }
    }
});