const User = require('../../models/User');
const supertokens = require("supertokens-node");
const EmailPassword = require('supertokens-node/recipe/emailpassword');

class PasswordController {
    async requestPasswordReset(req, res) {
        try {
            console.log('POST /auth/user/password/reset called with body:', req.body);

            const { formFields } = req.body;
            if (!formFields || !Array.isArray(formFields)) {
                console.error('Invalid request format: formFields missing or not an array');
                return res.status(400).json({
                    status: 'FIELD_ERROR',
                    formFields: [{ id: 'email', error: 'Email is required' }]
                });
            }

            const emailField = formFields.find(field => field.id === 'email');
            if (!emailField || !emailField.value) {
                console.error('Email field missing or empty');
                return res.status(400).json({
                    status: 'FIELD_ERROR',
                    formFields: [{ id: 'email', error: 'Email is required' }]
                });
            }

            const email = emailField.value.trim();
            console.log(`Requesting password reset for email: ${email}`);

            const response = await EmailPassword.sendResetPasswordEmail('public', email);
            console.log(`Password reset response: ${response.status}`);

            if (process.env.NODE_ENV !== 'production') {
                console.log(`Password reset link for ${email}:`, response.resetPasswordLink);
            }

            return res.json({ status: 'OK' });
        } catch (error) {
            console.error('Error in requestPasswordReset:', error);
            return res.json({ status: 'OK' }); // منع تعداد البريد
        }
    }

    async submitPasswordReset(req, res) {
        try {
            console.log('POST /auth/user/password/reset/submit called with body:', req.body);

            const { formFields } = req.body;
            if (!formFields || !Array.isArray(formFields)) {
                console.error('Invalid request format: formFields missing or not an array');
                return res.status(400).json({
                    success: false,
                    message: 'Invalid request format',
                    code: 'INVALID_REQUEST_FORMAT'
                });
            }

            const fields = formFields.reduce((acc, field) => {
                acc[field.id] = field.value;
                return acc;
            }, {});

            const { token, password } = fields;
            if (!token || !password) {
                console.error('Missing required fields:', { token: !!token, password: !!password });
                return res.status(400).json({
                    success: false,
                    message: 'Token and new password are required',
                    code: 'MISSING_FIELDS',
                    formFields: [
                        !token && { id: 'token', error: 'Reset token is required' },
                        !password && { id: 'password', error: 'New password is required' }
                    ].filter(Boolean)
                });
            }

            const resetResponse = await EmailPassword.resetPasswordUsingToken('public', token, password);
            console.log(`Reset password response: ${resetResponse.status}`);

            if (resetResponse.status !== 'OK') {
                console.error('Password reset failed:', resetResponse.status);
                return res.status(400).json({
                    success: false,
                    message: resetResponse.status === 'RESET_PASSWORD_INVALID_TOKEN_ERROR' 
                        ? 'Invalid or expired reset token' 
                        : 'Password does not meet requirements',
                    code: resetResponse.status,
                    formFields: [{ id: 'password', error: resetResponse.msg || 'Invalid input' }]
                });
            }

            // Get user by email from the reset response if available
            if (resetResponse.user) {
                const email = resetResponse.user.emails[0];
                if (email) {
                    await User.findOneAndUpdate(
                        { email },
                        { 'activityLog.passwordChangedAt': new Date() },
                        { new: true }
                    );
                    console.log(`Updated password change timestamp for email: ${email}`);
                }
            }

            return res.json({
                success: true,
                message: 'Password reset successfully'
            });
        } catch (error) {
            console.error('Error in submitPasswordReset:', error);
            return res.status(500).json({
                success: false,
                message: 'Error resetting password',
                code: 'SERVER_ERROR'
            });
        }
    }

    async updatePassword(req, res) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
            const userId = req.session.getUserId();
            console.log('Update password request for user ID:', userId);

            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'All password fields are required',
                    code: 'MISSING_FIELDS'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'New password and confirm password do not match',
                    code: 'PASSWORD_MISMATCH'
                });
            }

            const stUser = await supertokens.getUser(userId);
            if (!stUser) {
                console.error('SuperTokens user not found for ID:', userId);
                return res.status(404).json({
                    success: false,
                    message: 'User not found in SuperTokens',
                    code: 'USER_NOT_FOUND'
                });
            }

            const emailPasswordMethod = stUser.loginMethods.find(method => method.recipeId === 'emailpassword');
            if (!emailPasswordMethod) {
                console.error('No emailpassword login method found for user:', userId);
                return res.status(400).json({
                    success: false,
                    message: 'No password set for this account',
                    code: 'NO_PASSWORD_SET'
                });
            }

            const signInResponse = await EmailPassword.signIn('public', emailPasswordMethod.email, currentPassword);
            if (signInResponse.status !== 'OK') {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect',
                    code: 'INVALID_PASSWORD'
                });
            }

            const updateResponse = await EmailPassword.updateEmailOrPassword({
                recipeUserId: signInResponse.user.loginMethods[0].recipeUserId,
                password: newPassword
            });

            if (updateResponse.status !== 'OK') {
                console.error('Failed to update password in SuperTokens:', updateResponse.status);
                return res.status(400).json({
                    success: false,
                    message: 'Failed to update password',
                    code: updateResponse.status
                });
            }

            await User.findByIdAndUpdate(req.user._id, {
                'activityLog.passwordChangedAt': new Date()
            });
            console.log('Password updated successfully');
            return res.json({
                success: true,
                message: 'Password updated successfully'
            });
        } catch (error) {
            console.error('Error in updatePassword:', error);
            return res.status(500).json({
                success: false,
                message: 'Error updating password',
                code: 'SERVER_ERROR'
            });
        }
    }

    async adminResetPassword(req, res) {
        try {
            const { email, newPassword } = req.body;
            if (!email || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and new password are required',
                    code: 'MISSING_FIELDS'
                });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const stUser = await supertokens.getUser(user.supertokensId);
            if (!stUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found in SuperTokens',
                    code: 'USER_NOT_FOUND'
                });
            }

            const emailPasswordMethod = stUser.loginMethods.find(method => method.recipeId === 'emailpassword');
            if (!emailPasswordMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'User does not have an email/password login method',
                    code: 'NO_EMAIL_PASSWORD'
                });
            }

            await EmailPassword.updateEmailOrPassword({
                recipeUserId: emailPasswordMethod.recipeUserId,
                password: newPassword
            });

            await User.findByIdAndUpdate(user._id, {
                'activityLog.passwordChangedAt': new Date()
            });

            return res.json({
                success: true,
                message: 'Password reset successfully',
                userId: user._id
            });
        } catch (error) {
            console.error('Error in adminResetPassword:', error);
            return res.status(500).json({
                success: false,
                message: 'Error resetting password',
                code: 'RESET_PASSWORD_ERROR'
            });
        }
    }

    async verifyCurrentPassword(req, res) {
        try {
            const { password } = req.body;
            const userId = req.session.getUserId();
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required',
                    code: 'PASSWORD_REQUIRED'
                });
            }

            const stUser = await supertokens.getUser(userId);
            if (!stUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const emailPasswordMethod = stUser.loginMethods.find(method => method.recipeId === 'emailpassword');
            if (!emailPasswordMethod) {
                return res.status(400).json({
                    success: false,
                    message: 'No password set for this account',
                    code: 'NO_PASSWORD_SET'
                });
            }

            const signInResponse = await EmailPassword.signIn('public', emailPasswordMethod.email, password);
            if (signInResponse.status !== 'OK') {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect',
                    code: 'INVALID_PASSWORD'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Password verified successfully'
            });
        } catch (error) {
            console.error('Error verifying current password:', error);
            return res.status(500).json({
                success: false,
                message: 'Error verifying password',
                code: 'VERIFY_PASSWORD_ERROR'
            });
        }
    }
}

module.exports = new PasswordController();