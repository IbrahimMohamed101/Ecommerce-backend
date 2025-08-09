const mongoose = require('mongoose');
const crypto = require('crypto');
const supertokens = require('supertokens-node');
const User = require('../models/User');
const Role = require('../models/Role');
const { BadRequestError, InternalServerError } = require('../utils/errors');
const logger = require('../utils/logger');
const emailService = require('./emailService');

// Generate a random token for email verification – kept for potential future use
const generateToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Service layer responsible for creating a new admin / sub-admin user.
 * All business logic & DB operations live here so that the controller stays thin.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.firstName
 * @param {string} params.lastName
 * @param {('admin'|'subAdmin')} [params.adminType='admin']
 * @returns {Promise<Object>}    Reduced representation of the created user
 */
const createAdmin = async ({ email, password, firstName, lastName, adminType = 'admin' }) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
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

        // Import SuperTokens functions lazily
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
            profile: { firstName, lastName },
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
        const params = new URLSearchParams({ token: emailVerificationToken, email });
        const frontendUrl = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.APP_URL || 'https://ecommerce-backend-l7a2.onrender.com';
        const activationLink = `${frontendUrl}/auth/verify-email?${params.toString()}`;

        try {
            await emailService.sendActivationEmail(email, `${firstName} ${lastName}`, activationLink);
            logger.info(`Activation email sent to ${email}`);
        } catch (emailError) {
            logger.error('Failed to send activation email:', emailError);
            newAdmin.emailVerificationSent = false;
            await newAdmin.save({ session });
        }

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        logger.info(`New ${adminType} created: ${email} with SuperTokens ID: ${signUpResponse.user.id}`);

        return {
            id: newAdmin._id,
            email: newAdmin.email,
            role: role.name,
            supertokensId: signUpResponse.user.id,
            status: 'pending_verification'
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        logger.error('Error creating admin:', error);
        // Re-throw so that the controller can handle it centrally
        throw error;
    }
};

module.exports = {
    createAdmin
};
