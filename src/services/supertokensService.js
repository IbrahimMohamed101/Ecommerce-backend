const supertokens = require('supertokens-node');
const Session = require('supertokens-node/recipe/session');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const { UserContext } = require('supertokens-node/recipe/session');
const User = require('../models/User');
const Role = require('../models/Role');
const logger = require('../utils/logger');

class SuperTokensService {
    /**
     * Create a new user in SuperTokens and our database
     * @param {Object} userData - User data including email and password
     * @returns {Promise<Object>} Created user data
     */
    static async createUser(userData) {
        try {
            // 1. First create user in SuperTokens
            const signUpResponse = await EmailPassword.signUp(
                "public", // tenantId
                userData.email,
                userData.password,
                {
                    // Add any additional form fields here
                    formFields: [
                        { id: "email", value: userData.email },
                        { id: "firstName", value: userData.firstName || '' },
                        { id: "lastName", value: userData.lastName || '' }
                    ]
                }
            );

            if (signUpResponse.status !== "OK") {
                throw new Error(`Failed to create user in SuperTokens: ${signUpResponse.status}`);
            }

            console.log('SuperTokens signUp response:', signUpResponse);
            const { id } = signUpResponse.user;
            // Use the email from userData since it's the source of truth
            const email = userData.email;

            // 2. Create user in our database
            let vendorRole = await Role.findOne({ name: 'vendor' });
            if (!vendorRole) {
                // If vendor role doesn't exist, create it
                vendorRole = new Role({
                    name: 'vendor',
                    description: 'Vendor with product management permissions',
                    permissions: [
                        'vendor:basic',
                        'vendor:manage_products',
                        'vendor:manage_orders',
                        'vendor:view_analytics'
                    ]
                });
                await vendorRole.save();
            }

            const newUser = new User({
                supertokensId: id,
                email: email.toLowerCase(),
                role: vendorRole._id,
                profile: {
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    phone: userData.phone || ''
                },
                vendorDetails: userData.vendorDetails || {},
                isActive: false, // Will be activated after email verification and admin approval
                isEmailVerified: false,
                permissions: ['vendor:basic']
            });

            const savedUser = await newUser.save();
            
            logger.info('User created in both SuperTokens and database', {
                userId: savedUser._id,
                supertokensId: id,
                email: email
            });

            // Convert Mongoose document to plain object
            const userObject = savedUser.toObject();
            
            // Return the plain object with id field for consistency
            return {
                ...userObject,
                id: userObject._id
            };
            
        } catch (error) {
            logger.error('Error creating user in SuperTokens:', error);
            
            // If user was created in SuperTokens but not in our DB,
            // we should delete it from SuperTokens to keep them in sync
            if (error.message.includes('already exists') && error.message.includes('email')) {
                throw new Error('User with this email already exists');
            }
            
            throw error;
        }
    }

    /**
     * Verify if a user exists in SuperTokens
     * @param {string} userId - The user's ID
     * @returns {Promise<boolean>} True if user exists, false otherwise
     */
    static async userExists(userId) {
        try {
            await supertokens.getUser(userId);
            return true;
        } catch (error) {
            if (error.message.includes('Unknown User ID')) {
                return false;
            }
            throw error;
        }
    }
}

module.exports = SuperTokensService;