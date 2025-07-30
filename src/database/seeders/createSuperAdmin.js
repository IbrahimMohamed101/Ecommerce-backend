require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const supertokens = require('supertokens-node');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const User = require('../../models/User');
const Role = require('../../models/Role');
const config = require('../../config/environment');

// Initialize SuperTokens with the same configuration as in the main app
supertokens.init({
    framework: "express",
    supertokens: {
        connectionURI: config.supertokens.connectionURI,
        apiKey: config.supertokens.apiKey,
    },
    appInfo: {
        ...config.supertokens.appInfo,
        apiDomain: process.env.APP_URL || 'http://localhost:3000',
        websiteDomain: process.env.CLIENT_URL || 'http://localhost:3000',
    },
    recipeList: [
        require('supertokens-node/recipe/emailverification').init({
            mode: 'REQUIRED',
        }),
        EmailPassword.init({
            signUpFeature: {
                formFields: [
                    {
                        id: "email",
                        validate: async (value) => {
                            if (typeof value !== 'string') {
                                return 'Email must be a string';
                            }
                            if (value.length < 3) {
                                return 'Email must be at least 3 characters long';
                            }
                            if (!value.includes('@')) {
                                return 'Email must contain an @ symbol';
                            }
                            return undefined;
                        }
                    },
                    {
                        id: "password",
                        validate: async (value) => {
                            if (typeof value !== 'string') {
                                return 'Password must be a string';
                            }
                            if (value.length < 8) {
                                return 'Password must be at least 8 characters long';
                            }
                            return undefined;
                        }
                    }
                ]
            },
            override: {
                apis: (originalImplementation) => ({
                    ...originalImplementation,
                    signUpPOST: async function (input) {
                        // This is where you can add custom logic for signup
                        return originalImplementation.signUpPOST(input);
                    }
                })
            }
        }),
        require('supertokens-node/recipe/session').init(),
    ]
});

// Database connection is now handled by the main server

async function createSuperAdmin() {
    const {
        SUPER_ADMIN_EMAIL,
        SUPER_ADMIN_PHONE,
        SUPER_ADMIN_FIRST_NAME,
        SUPER_ADMIN_LAST_NAME,
        DEFAULT_ADMIN_PASSWORD,
    } = process.env;

    if (!SUPER_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) {
        console.error('❌ Missing credentials in .env');
        process.exit(1);
    }

    // تحقق إذا السوبر أدمن موجود
    const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (existing) {
        console.log('⚠️ Super Admin already exists.');
        return;
    }

    // الحصول على الـ role
    const role = await Role.findOne({ name: 'superAdmin' });
    if (!role) {
        console.error('❌ Role "superAdmin" not found. Did you run role seeder?');
        process.exit(1);
    }

    // إنشاء حساب في SuperTokens
    let signUpResponse;
    let supertokensUserId;
    
    try {
        console.log('🔄 Creating user in SuperTokens...');
        signUpResponse = await EmailPassword.signUp("public", SUPER_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
        
        if (signUpResponse.status === "OK") {
            supertokensUserId = signUpResponse.user.id;
            console.log('✅ SuperTokens user created successfully');
        } else if (signUpResponse.status === "EMAIL_ALREADY_EXISTS_ERROR") {
            console.warn('⚠️ SuperTokens user already exists. Attempting to sign in to get user ID...');
            // Since user exists, try to sign in to get the user ID
            try {
                const signInResponse = await EmailPassword.signIn("public", SUPER_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
                if (signInResponse.status === "OK") {
                    supertokensUserId = signInResponse.user.id;
                    console.log('✅ Retrieved existing user ID via sign in');
                } else if (signInResponse.status === "WRONG_CREDENTIALS_ERROR") {
                    console.error('❌ Wrong credentials for existing SuperTokens user');
                    console.error('❌ Please check your DEFAULT_ADMIN_PASSWORD in .env file');
                    process.exit(1);
                } else {
                    console.error('❌ Could not sign in to existing SuperTokens user:', signInResponse);
                    process.exit(1);
                }
            } catch (signInError) {
                console.error('❌ Sign in attempt failed:', signInError.message);
                process.exit(1);
            }
        } else {
            console.error('❌ Failed to create SuperTokens user:', signUpResponse);
            process.exit(1);
        }
    } catch (err) {
        console.error('❌ Failed to sign up in SuperTokens:', err.message);
        process.exit(1);
    }

    // إنشاء المستخدم في MongoDB
    try {
        console.log('🔄 Creating user in MongoDB...');
        const user = new User({
            supertokensId: supertokensUserId,
            email: SUPER_ADMIN_EMAIL,
            role: role._id,
            isEmailVerified: true,
            profile: {
                firstName: SUPER_ADMIN_FIRST_NAME,
                lastName: SUPER_ADMIN_LAST_NAME,
                phone: SUPER_ADMIN_PHONE,
            },
        });

        await user.save();
        console.log('✅ Super Admin created successfully in MongoDB.');
    } catch (err) {
        console.error('❌ Failed to create user in MongoDB:', err.message);
        process.exit(1);
    }
}

async function run() {
    try {
        console.log('🚀 Starting Super Admin creation script...');
        
        // Create Super Admin
        await createSuperAdmin();
        
        console.log('✅ Super Admin creation completed successfully');
        return true;
    } catch (error) {
        console.error('❌ Error in Super Admin creation script:', error);
        throw error;
    }
}

module.exports = run;