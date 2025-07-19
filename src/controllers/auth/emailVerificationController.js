const supertokens = require("supertokens-node");
const EmailVerification = require("supertokens-node/recipe/emailverification");
const Session = require("supertokens-node/recipe/session");

class EmailVerificationController {
    async resendEmailVerification(req, res) {
        try {
            // Get the session first
            const session = await Session.getSession(req, res, { sessionRequired: true });
            
            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized',
                    code: 'UNAUTHORIZED'
                });
            }
            
            // Get user ID and tenant ID
            const userId = session.getUserId();
            const tenantId = session.getTenantId();
            
            console.log('User ID:', userId);
            console.log('Tenant ID:', tenantId);
            
            // Get the user details from SuperTokens
            const stUser = await supertokens.getUser(userId);
            
            if (!stUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Find the email/password login method
            const emailPasswordMethod = stUser.loginMethods.find(method => method.recipeId === 'emailpassword');
            if (!emailPasswordMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'User does not have an email/password login method',
                    code: 'NO_EMAIL_PASSWORD'
                });
            }

            console.log('Email to verify:', emailPasswordMethod.email);
            console.log('Recipe User ID from login method:', emailPasswordMethod.recipeUserId);

            // Check if email is already verified
            const isVerified = await EmailVerification.isEmailVerified(emailPasswordMethod.recipeUserId, emailPasswordMethod.email);
            
            if (isVerified) {
                return res.json({
                    success: true,
                    message: 'Email is already verified'
                });
            }

            // Use the recipeUserId from the login method instead of the session
            await EmailVerification.sendEmailVerificationEmail(tenantId, emailPasswordMethod.recipeUserId, emailPasswordMethod.email);
            
            return res.json({
                success: true,
                message: 'Verification email sent successfully'
            });
            
        } catch (error) {
            console.error('Error in resendEmailVerification:', error);
            
            if (error.type === Session.Error.TRY_REFRESH_TOKEN || 
                error.type === Session.Error.UNAUTHORISED) {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please refresh your page and try again.',
                    code: 'SESSION_EXPIRED'
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'Error sending verification email: ' + error.message,
                code: 'EMAIL_VERIFICATION_ERROR'
            });
        }
    }
}

module.exports = new EmailVerificationController();