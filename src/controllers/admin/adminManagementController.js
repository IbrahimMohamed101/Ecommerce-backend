const mongoose = require('mongoose');
const crypto = require('crypto');
const supertokens = require('supertokens-node'); // Add this import
const User = require('../../models/User');
const Role = require('../../models/Role');
const { BadRequestError, InternalServerError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const emailService = require('../../services/emailService');

// Generate a random token for email verification
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a new admin user (superAdmin or admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createAdmin = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { email, password, firstName, lastName, adminType = 'admin' } = req.body;

        // Validate admin type
        if (!['admin', 'subAdmin'].includes(adminType)) {
            throw new BadRequestError('Invalid admin type. Must be either "admin" or "subAdmin"');
        }

        // Check if user already exists in our database
        const existingUser = await User.findOne({ email }).session(session);
        if (existingUser) {
            throw new BadRequestError('User with this email already exists');
        }

        // Get the role for the admin type
        const role = await Role.findOne({ name: adminType }).session(session);
        if (!role) {
            throw new InternalServerError('Could not find the specified admin role');
        }

        // Import SuperTokens functions
        const { signUp } = require('supertokens-node/recipe/emailpassword');

        // Create the user in SuperTokens first
        const signUpResponse = await signUp("public", email, password);

        if (signUpResponse.status !== "OK") {
            if (signUpResponse.status === "EMAIL_ALREADY_EXISTS_ERROR") {
                throw new BadRequestError('User with this email already exists in authentication service');
            }
            throw new InternalServerError(`Failed to create user in authentication service: ${signUpResponse.status}`);
        }

        // Generate email verification token using SuperTokens
        const { createEmailVerificationToken } = require('supertokens-node/recipe/emailverification');
        
        // Use the correct way to create RecipeUserId
        const recipeUserId = supertokens.convertToRecipeUserId(signUpResponse.user.id);
        const tokenResponse = await createEmailVerificationToken("public", recipeUserId);
        
        if (tokenResponse.status !== "OK") {
            throw new InternalServerError(`Failed to create email verification token: ${tokenResponse.status}`);
        }
        const emailVerificationToken = tokenResponse.token;
        // Optional: set an explicit expiry 24h from now for reference purposes
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create the user in our database
        const newAdmin = new User({
            supertokensId: signUpResponse.user.id,
            email,
            profile: {
                firstName,
                lastName
            },
            role: role._id,
            isActive: false, // Will be activated after email verification
            isEmailVerified: false,
            emailVerificationToken,
            emailVerificationExpires,
            emailVerificationSent: false
        });

        await newAdmin.save({ session });
        logger.info(`New admin created with ID: ${newAdmin._id} and email: ${email}`);

        // Send activation email
        const params = new URLSearchParams({
            token: emailVerificationToken,
            email: email
        });
        const frontendUrl = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.APP_URL || 'https://ecommerce-backend-l7a2.onrender.com';
        const basePath = (process.env.NEXT_PUBLIC_WEBSITE_BASE_PATH || '').replace(/^\/+/,'').replace(/\/+$/,'');
        const activationLink = `${frontendUrl}/auth/verify-email?${params.toString()}`;
        
        try {
            await emailService.sendActivationEmail(
                email,
                `${firstName} ${lastName}`,
                activationLink
            );
            logger.info(`Activation email sent to ${email}`);
        } catch (emailError) {
            // Log the error but don't fail the request
            logger.error('Failed to send activation email:', emailError);
            // Continue with the response but indicate the email wasn't sent
            newAdmin.emailVerificationSent = false;
            await newAdmin.save({ session });
        }

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        logger.info(`New ${adminType} created: ${email} with SuperTokens ID: ${signUpResponse.user.id}`);

        res.status(201).json({
            success: true,
            message: `${adminType} created successfully`,
            data: {
                id: newAdmin._id,
                email: newAdmin.email,
                role: role.name,
                supertokensId: signUpResponse.user.id,
                status: 'pending_verification'
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        logger.error('Error creating admin:', error);
        
        // Handle specific SuperTokens errors
        if (error.message && error.message.includes('SuperTokens core threw an error')) {
            return next(new InternalServerError('Authentication service error. Please check SuperTokens configuration and ensure the core service is running.'));
        }
        
        next(error);
    }
};

module.exports = {
    createAdmin
};