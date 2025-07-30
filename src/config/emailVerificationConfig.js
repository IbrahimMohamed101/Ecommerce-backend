const EmailVerification = require("supertokens-node/recipe/emailverification");
const emailService = require('../services/emailService');
const User = require('../models/User');

// Create a function to send verification email
async function sendVerificationEmail(user, email, emailVerifyLink) {
    try {
        console.log('📧 Sending verification email to:', email);
        console.log('🔗 Verification link:', emailVerifyLink);

        // Use the custom email service to send the verification link
        await emailService.sendVerificationEmail(email, emailVerifyLink);
        console.log('✅ Email sent successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send verification email:', error);
        throw error;
    }
}

module.exports = EmailVerification.init({
    // "OPTIONAL" means email verification is not required, change to "REQUIRED" if needed
    mode: "OPTIONAL",

    // Customize email delivery
    emailDelivery: {
        override: (originalImplementation) => {
            return {
                ...originalImplementation,
                sendEmail: async (input) => {
                    // This handles both initial verification and resend flows
                    if (input.type === "EMAIL_VERIFICATION") {
                        return sendVerificationEmail(
                            input.user,
                            input.user.email,
                            input.emailVerifyLink
                        );
                    }
                    // For other email types, use the original implementation
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
                    console.log('🔄 Email verification POST request received');
                    const response = await originalImplementation.verifyEmailPOST(input);

                    if (response.status === "OK") {
                        console.log('✅ Email verified successfully, updating database');
                        // Update verification status in the database
                        await User.findOneAndUpdate(
                            { supertokensId: input.session.getUserId() },
                            { 
                                isEmailVerified: true,
                                'activityLog.emailVerifiedAt': new Date()
                            },
                            { new: true }
                        );
                    }

                    return response;
                },

                // Handle email verification token generation
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