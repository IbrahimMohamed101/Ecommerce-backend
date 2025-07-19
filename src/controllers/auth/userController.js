const User = require('../../models/User');
const supertokens = require("supertokens-node");
const EmailPassword = require('supertokens-node/recipe/emailpassword');

class UserController {
    async getCurrentUser(req, res) {
        try {
            console.log('getCurrentUser - Session user:', req.user);
            if (!req.user || !req.user._id) {
                console.log('No user in request or missing user ID');
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated or session expired',
                    code: 'UNAUTHORIZED'
                });
            }

            const user = await User.findById(req.user._id)
                .select('-password -__v -resetPasswordToken -resetPasswordExpire -verificationToken -verificationTokenExpires')
                .lean();
            
            if (!user) {
                console.log(`User not found with ID: ${req.user._id}`);
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const userData = {
                ...user,
                session: {
                    lastActive: req.session?.getAccessTokenPayload()?.iat 
                        ? new Date(req.session.getAccessTokenPayload().iat * 1000) 
                        : new Date()
                }
            };
            
            console.log('Returning user data for:', user.email);
            return res.status(200).json({
                success: true,
                data: userData
            });
        } catch (error) {
            console.error('Error in getCurrentUser:', error);
            if (error.name === 'CastError') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                    code: 'INVALID_USER_ID'
                });
            }
            return res.status(500).json({
                success: false,
                message: 'Error fetching user data',
                code: 'SERVER_ERROR',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async deleteAccount(req, res) {
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
                    message: 'Password is incorrect',
                    code: 'INVALID_PASSWORD'
                });
            }

            await supertokens.deleteUser(userId);
            await User.findByIdAndUpdate(req.user._id, {
                isActive: false,
                email: `deleted_${Date.now()}_${req.user.email}`,
                deletedAt: new Date()
            });

            return res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteAccount:', error);
            return res.status(500).json({
                success: false,
                message: 'Error deleting account',
                code: 'DELETE_ACCOUNT_ERROR'
            });
        }
    }
}

module.exports = new UserController();