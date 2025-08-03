const User = require('../../models/User');
const { BadRequestError, UnauthorizedError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');
const EmailVerification = require('supertokens-node/recipe/emailverification');
const supertokens = require('supertokens-node');

/**
 * Verify user's email using the token sent to their email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyEmail = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { token, email } = req.query;
        
        logger.info('Email verification request received', { 
            email: email ? `${email.substring(0, 3)}...${email.split('@')[1]}` : 'no-email',
            token: token ? `${token.substring(0, 8)}...` : 'no-token'
        });

        // Validate token and email
        if (!token || !email) {
            throw new BadRequestError('Verification token and email are required');
        }

        // Decode URL-encoded email
        const decodedEmail = decodeURIComponent(email);
        
        // Log the search criteria
        logger.info('Verifying email with SuperTokens', { 
            email: `${decodedEmail.substring(0, 3)}...@${decodedEmail.split('@')[1]}`,
            tokenStart: token.substring(0, 8)
        });

        // Verify the token using SuperTokens directly
        const tokenVerifyResponse = await EmailVerification.verifyEmailUsingToken('public', token);
        
        logger.info('SuperTokens verification response:', {
            status: tokenVerifyResponse.status,
            hasUser: !!tokenVerifyResponse.user
        });
        
        if (tokenVerifyResponse.status !== 'OK') {
            logger.warn('Token verification failed', {
                status: tokenVerifyResponse.status,
                email: `${decodedEmail.substring(0, 3)}...@${decodedEmail.split('@')[1]}`
            });
            
            // Handle different error types
            let errorMessage = 'Invalid or expired verification token';
            if (tokenVerifyResponse.status === 'EMAIL_VERIFICATION_INVALID_TOKEN_ERROR') {
                errorMessage = 'Invalid or expired verification token';
            }
            
            throw new UnauthorizedError(errorMessage);
        }

        // Get user ID from the verification response
        let userId;
        if (tokenVerifyResponse.user) {
            if (tokenVerifyResponse.user.recipeUserId) {
                // Handle RecipeUserId object
                if (typeof tokenVerifyResponse.user.recipeUserId.getAsString === 'function') {
                    userId = tokenVerifyResponse.user.recipeUserId.getAsString();
                } else {
                    userId = tokenVerifyResponse.user.recipeUserId;
                }
            } else if (tokenVerifyResponse.user.id) {
                userId = tokenVerifyResponse.user.id;
            }
        }

        if (!userId) {
            logger.error('Could not extract user ID from verification response');
            throw new UnauthorizedError('Invalid verification response');
        }

        logger.info('Extracted user ID from verification response:', userId);

        // Get the user from our database using SuperTokens ID or email
        let user = await User.findOne({ 
            $or: [
                { supertokensId: userId },
                { email: decodedEmail }
            ]
        }).session(session);

        if (!user) {
            logger.error('User not found in database', {
                supertokensId: userId,
                email: `${decodedEmail.substring(0, 3)}...@${decodedEmail.split('@')[1]}`
            });
            throw new UnauthorizedError('User not found');
        }

        // Update user's verification status in our database
        const updateData = {
            isEmailVerified: true,
            isActive: true,
            'activityLog.emailVerifiedAt': new Date()
        };

        // Remove verification token fields if they exist
        if (user.emailVerificationToken) {
            updateData.emailVerificationToken = undefined;
        }
        if (user.emailVerificationExpires) {
            updateData.emailVerificationExpires = undefined;
        }
        if (user.emailVerificationSent) {
            updateData.emailVerificationSent = undefined;
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $set: updateData, $unset: { 
                emailVerificationToken: 1, 
                emailVerificationExpires: 1, 
                emailVerificationSent: 1 
            }},
            { new: true, session }
        );

        await session.commitTransaction();
        session.endSession();

        logger.info(`✅ Email verified successfully`, {
            userId: updatedUser.supertokensId,
            email: `${updatedUser.email.substring(0, 3)}...@${updatedUser.email.split('@')[1]}`,
            isVerified: updatedUser.isEmailVerified
        });

        // Redirect to success page or return success response
        if (req.accepts('html')) {
            // For browser requests, redirect to success page
            const clientUrl = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.CLIENT_URL || 'https://ecommerce-backend-l7a2.onrender.com';
            return res.redirect(`${clientUrl}/auth/verification-success`);
        } else {
            // For API requests, return JSON response
            return res.status(200).json({
                success: true,
                message: 'Email verified successfully',
                data: {
                    email: updatedUser.email,
                    isVerified: updatedUser.isEmailVerified,
                    isActive: updatedUser.isActive,
                    verifiedAt: updatedUser.activityLog.emailVerifiedAt
                }
            });
        }
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        logger.error('Email verification failed:', {
            error: error.message,
            stack: error.stack,
            token: req.query.token ? 'provided' : 'missing',
            email: req.query.email ? `${req.query.email.substring(0, 3)}...` : 'missing'
        });
        
        if (req.accepts('html')) {
            // Redirect to error page with error message
            const clientUrl = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.CLIENT_URL || 'https://ecommerce-backend-l7a2.onrender.com';
            return res.redirect(
                `${clientUrl}/auth/verification-error?error=${encodeURIComponent(error.message)}`
            );
        } else {
            next(error);
        }
    }
};

/**
 * Resend email verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            throw new BadRequestError('Email is required');
        }

        logger.info('Resend verification email requested', {
            email: `${email.substring(0, 3)}...@${email.split('@')[1]}`
        });

        // Find user in our database
        const user = await User.findOne({ email });
        if (!user) {
            throw new BadRequestError('User not found');
        }

        if (user.isEmailVerified) {
            throw new BadRequestError('Email is already verified');
        }

        // Send verification email using SuperTokens
        const result = await EmailVerification.sendEmail({
            type: "EMAIL_VERIFICATION",
            user: {
                id: user.supertokensId,
                email: email
            },
            tenantId: "public"
        });

        logger.info('Verification email resent successfully', {
            email: `${email.substring(0, 3)}...@${email.split('@')[1]}`,
            userId: user.supertokensId
        });

        return res.json({
            success: true,
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        logger.error('Failed to resend verification email:', {
            error: error.message,
            email: req.body.email ? `${req.body.email.substring(0, 3)}...@${req.body.email.split('@')[1]}` : 'not provided'
        });
        next(error);
    }
};

module.exports = {
    verifyEmail,
    resendVerification
};