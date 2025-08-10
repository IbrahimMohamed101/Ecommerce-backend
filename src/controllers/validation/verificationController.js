const User = require('../../models/User');
const logger = require('../../utils/logger');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const EmailTemplates = require('../../templates/emailTemplates');
const Session = require('supertokens-node/recipe/session');
const EmailVerification = require('supertokens-node/recipe/emailverification');

class VerificationController {
    /**
     * Verify user's email using the verification token
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async verifyEmail(req, res, next) {
        try {
            const { token, email } = req.query;
            
            if (!token) {
                throw new BadRequestError('Verification token is required');
            }

            try {
                // First try SuperTokens verification
                const response = await EmailVerification.verifyEmailUsingToken(token);
                
                if (response.status === 'OK') {
                    // Update our database to mark email as verified
                    const user = await User.findOneAndUpdate(
                        { email: response.user.email },
                        { 
                            isEmailVerified: true,
                            emailVerificationToken: undefined,
                            emailVerificationExpires: undefined,
                            emailVerificationSent: true 
                        },
                        { new: true }
                    );

                    if (!user) {
                        logger.warn('User not found after SuperTokens verification', { email: response.user.email });
                    } else {
                        logger.info('Email verified via SuperTokens and DB updated', { 
                            userId: user._id, 
                            email: user.email 
                        });
                    }

                    // Redirect to frontend with success message or show success page
                    if (process.env.FRONTEND_VERIFICATION_SUCCESS_URL) {
                        return res.redirect(process.env.FRONTEND_VERIFICATION_SUCCESS_URL);
                    }

                    const htmlResponse = EmailTemplates.getVerificationSuccessHTML(response.user.email);
                    return res.status(200).send(htmlResponse);
                }
            } catch (stError) {
                logger.warn('SuperTokens verification failed, trying custom verification', {
                    error: stError.message,
                    token: token.substring(0, 10) + '...'
                });
                
                // If SuperTokens verification fails, try custom verification
                const user = await User.findOne({
                    emailVerificationToken: token,
                    emailVerificationExpires: { $gt: Date.now() }
                });

                if (!user) {
                    throw new BadRequestError('Invalid or expired verification token');
                }

                // Update user's verification status
                user.isEmailVerified = true;
                user.emailVerificationToken = undefined;
                user.emailVerificationExpires = undefined;
                user.emailVerificationSent = true;
                
                await user.save();

                logger.info('Email verified via custom token', { 
                    userId: user._id, 
                    email: user.email 
                });

                // Redirect to frontend with success message or show success page
                if (process.env.FRONTEND_VERIFICATION_SUCCESS_URL) {
                    return res.redirect(process.env.FRONTEND_VERIFICATION_SUCCESS_URL);
                }

                const htmlResponse = EmailTemplates.getVerificationSuccessHTML(user.email);
                return res.status(200).send(htmlResponse);
            }

        } catch (error) {
            logger.error('Email verification failed', {
                error: error.message,
                token: req.query.token,
                stack: error.stack
            });
            
            // Redirect to frontend with error message if URL is configured
            if (process.env.FRONTEND_VERIFICATION_ERROR_URL) {
                return res.redirect(`${process.env.FRONTEND_VERIFICATION_ERROR_URL}?error=${encodeURIComponent(error.message)}`);
            }
            
            next(error);
        }
    }
}

module.exports = VerificationController;
