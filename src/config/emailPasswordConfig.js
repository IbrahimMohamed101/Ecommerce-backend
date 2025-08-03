const EmailPassword = require("supertokens-node/recipe/emailpassword");
const EmailVerification = require("supertokens-node/recipe/emailverification").default;
const User = require('../models/User');
const Role = require('../models/Role');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// Initialize Email Verification recipe
EmailVerification.init({
    mode: 'REQUIRED',
    emailDelivery: {
        service: {
            sendEmail: async function (input) {
                try {
                    const frontendUrl = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.APP_URL || 'https://ecommerce-backend-l7a2.onrender.com';
                    const basePath = process.env.NEXT_PUBLIC_WEBSITE_BASE_PATH || '';
                    const verificationLink = `${frontendUrl}${basePath}/auth/verify-email?token=${input.emailVerifyLink.split('?token=')[1]}&email=${encodeURIComponent(input.user.email)}`;
                    
                    logger.info('Sending verification email', { 
                        to: input.user.email,
                        verificationLink: verificationLink 
                    });

                    if (process.env.NODE_ENV !== 'production') {
                        logger.info('DEVELOPMENT MODE: Email verification link (not actually sent):', verificationLink);
                        return { status: 'OK' };
                    }

                    // Send the email using the email service
                    await emailService.sendVerificationEmail(
                        input.user.email,
                        verificationLink
                    );
                    
                    return { status: 'OK' };
                } catch (error) {
                    logger.error('Failed to send verification email:', error);
                    // Don't throw the error to prevent signup from failing
                    return { status: 'OK' }; // Return OK to prevent blocking the user
                }
            }
        }
    },
    override: {
        apis: (oI) => oI
    }
});

// Initialize Email Password recipe
module.exports = EmailPassword.init({
    emailDelivery: {
        override: (originalImplementation) => {
            return {
                ...originalImplementation,
                sendEmail: async (input) => {
                    try {
                        console.log('📧 PasswordReset: Would send reset email to:', input.user.email);
                        console.log('🔗 PasswordReset: Reset link:', input.passwordResetLink);
                        
                        if (process.env.NODE_ENV !== 'production') {
                            console.log('🔐 DEVELOPMENT MODE: Password reset link (not actually sent):', input.passwordResetLink);
                            return { status: 'OK' };
                        }
                        
                        const result = await emailService.sendPasswordResetEmail(
                            input.user.email,
                            input.passwordResetLink
                        );
                        console.log('✅ PasswordReset: Email sent successfully');
                        return result;
                    } catch (error) {
                        console.error('❌ PasswordReset: Failed to send reset email:', error);
                        throw error;
                    }
                }
            };
        }
    },
    override: {
        apis: (originalImplementation) => {
            return {
                ...originalImplementation,
                signUpPOST: async function (input) {
                    console.log('📝 Starting signup process...');
                    
                    const formFields = input.formFields.reduce((acc, field) => {
                        acc[field.id] = field.value;
                        return acc;
                    }, {});
                    
                    const { email, password, firstName = '', lastName = '' } = formFields;

                    console.log('📧 Signup email:', email);

                    const existingUser = await User.findOne({ email });
                    if (existingUser) {
                        console.log('❌ User already exists');
                        return {
                            status: "EMAIL_ALREADY_EXISTS_ERROR"
                        };
                    }

                    // Get or create customer role
                    let customerRole = await Role.findOne({ name: 'customer' });
                    if (!customerRole) {
                        customerRole = await Role.create({
                            name: 'customer',
                            description: 'Regular customer with basic permissions',
                            isDefault: true
                        });
                    }

                    console.log('🔄 Creating user in SuperTokens...');
                    const response = await originalImplementation.signUpPOST(input);
                    console.log('📝 SuperTokens signup response:', response);

                    if (response.status === "OK") {
                        console.log('🔄 Creating user in database...');
                        const newUser = new User({
                            supertokensId: response.user.id,
                            email: email,
                            role: customerRole._id,
                            isActive: true,
                            isEmailVerified: false,
                            profile: {
                                firstName: firstName || 'User',
                                lastName: lastName || String(new Date().getFullYear()),
                                phone: '',
                                avatar: ''
                            },
                            preferences: {
                                notifications: {
                                    email: true,
                                    sms: false,
                                    push: true
                                },
                                language: 'ar',
                                currency: 'EGP'
                            },
                            activityLog: {
                                lastLogin: new Date(),
                                emailVerifiedAt: null
                            }
                        });

                        await newUser.save();
                        console.log('✅ User created in database:', newUser._id);

                        try {
                            console.log('🔄 Triggering email verification...');
                            
                            // Get the recipe user ID correctly
                            let recipeUserId;
                            
                            if (response.user.loginMethods && response.user.loginMethods.length > 0) {
                                // Get from loginMethods array - this is the RecipeUserId object
                                recipeUserId = response.user.loginMethods[0].recipeUserId;
                            } else {
                                // This shouldn't happen, but fallback to creating a RecipeUserId
                                const { RecipeUserId } = require("supertokens-node/lib/build/recipeUserId");
                                recipeUserId = new RecipeUserId(response.user.id);
                            }
                            
                            console.log('🔍 Using recipeUserId object:', recipeUserId);
                            
                            // Use the RecipeUserId object directly (not as string)
                            const tokenResult = await EmailVerification.createEmailVerificationToken(
                                "public", 
                                recipeUserId  // Pass the object, not string
                            );
                            
                            if (tokenResult.status === "OK") {
                                logger.info('Email verification token created for user', { 
                                    userId: response.user.id,
                                    recipeUserId: recipeUserId.getAsString(),
                                    email: email,
                                    token: tokenResult.token
                                });
                                
                                // Create the verification link with /auth prefix
                                const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                                const verificationLink = `${frontendUrl}/auth/verify-email?token=${tokenResult.token}&email=${encodeURIComponent(email)}`;
                                
                                // Send verification email directly using our email service
                                try {
                                    await emailService.sendVerificationEmail(email, verificationLink);
                                    logger.info('Email verification email sent successfully', { 
                                        userId: response.user.id,
                                        email: email
                                    });
                                } catch (emailError) {
                                    logger.error('Failed to send verification email:', emailError);
                                    // Don't fail the signup process
                                }
                            } else {
                                logger.warn('Failed to create email verification token', {
                                    userId: response.user.id,
                                    status: tokenResult.status,
                                    error: tokenResult.error || 'Unknown error'
                                });
                            }
                        } catch (error) {
                            logger.error('Failed to initiate email verification:', {
                                error: error.message,
                                stack: error.stack,
                                userId: response.user.id
                            });
                            // Don't fail the signup if email verification fails
                            // The user can request a new verification email later
                        }
                    }

                    return response;
                },
                signInPOST: async function (input) {
                    console.log('🔄 Processing sign-in...');
                    const response = await originalImplementation.signInPOST(input);
                    
                    if (response.status === "OK") {
                        console.log('✅ Sign-in successful, updating user data...');
                        await User.findOneAndUpdate(
                            { supertokensId: response.user.id },
                            { 
                                lastLogin: new Date(),
                                'activityLog.lastSeen': new Date()
                            }
                        );
                    }
                    
                    return response;
                },
                generatePasswordResetTokenPOST: async function (input) {
                    console.log('🔄 Generating password reset token...');
                    const formFields = input.formFields.reduce((acc, field) => {
                        acc[field.id] = field.value;
                        return acc;
                    }, {});
                    
                    const email = formFields.email;
                    console.log('📧 Password reset requested for email:', email);

                    const response = await originalImplementation.generatePasswordResetTokenPOST(input);
                    console.log('📝 Password reset token response:', response);

                    if (response.status === "OK") {
                        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                        const resetLink = `${frontendUrl}/reset-password?token=${response.token}`;
                        console.log('🔗 Password reset link:', resetLink);

                        try {
                            const emailResult = await emailService.sendPasswordResetEmail(
                                email,
                                resetLink
                            );
                            console.log('✅ Password reset email sent:', emailResult);
                        } catch (error) {
                            console.error('❌ Failed to send password reset email:', error);
                        }
                    }

                    return response;
                },
                passwordResetPOST: async function (input) {
                    console.log('🔄 Processing password reset...');
                    const formFields = input.formFields.reduce((acc, field) => {
                        acc[field.id] = field.value;
                        return acc;
                    }, {});
                    
                    const { token, password } = formFields;
                    console.log('🔐 Attempting to reset password with token');

                    const response = await originalImplementation.passwordResetPOST(input);
                    console.log('📝 Password reset response:', response);

                    if (response.status === "OK") {
                        const tokenInfo = await EmailPassword.getResetPasswordTokenInfo(token).catch(() => null);
                        if (tokenInfo?.email) {
                            await User.findOneAndUpdate(
                                { email: tokenInfo.email },
                                { 'activityLog.passwordChangedAt': new Date() }
                            );
                            console.log('✅ Updated password change timestamp for email:', tokenInfo.email);
                        }
                    }

                    return response;
                }
            };
        }
    }
});