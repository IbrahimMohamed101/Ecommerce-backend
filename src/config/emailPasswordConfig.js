const EmailPassword = require("supertokens-node/recipe/emailpassword");
const User = require('../models/User');
const emailService = require('../services/emailService');
const EmailVerificationInstance = require("supertokens-node/recipe/emailverification");

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
                    
                    const email = formFields.email;
                    const password = formFields.password;

                    console.log('📧 Signup email:', email);

                    const existingUser = await User.findOne({ email });
                    if (existingUser) {
                        console.log('❌ User already exists');
                        return {
                            status: "EMAIL_ALREADY_EXISTS_ERROR"
                        };
                    }

                    console.log('🔄 Creating user in SuperTokens...');
                    const response = await originalImplementation.signUpPOST(input);
                    console.log('📝 SuperTokens signup response:', response);

                    if (response.status === "OK") {
                        console.log('🔄 Creating user in database...');
                        const newUser = new User({
                            supertokensId: response.user.id,
                            email: email,
                            role: 'customer',
                            isActive: true,
                            isEmailVerified: false,
                            profile: {
                                firstName: '',
                                lastName: '',
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
                            const tokenResponse = await EmailVerificationInstance.createEmailVerificationToken(
                                "public",
                                response.user.loginMethods[0].recipeUserId,
                                email
                            );
                            
                            console.log('📝 Token creation response:', tokenResponse);
                            
                            if (tokenResponse.status === "OK") {
                                const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                                const verificationLink = `${frontendUrl}/verify-email?token=${tokenResponse.token}`;
                                console.log('🔗 Verification link:', verificationLink);
                                
                                const emailResult = await emailService.sendVerificationEmail(
                                    email,
                                    verificationLink
                                );
                                console.log('✅ Verification email sent:', emailResult);
                            }
                        } catch (error) {
                            console.error('❌ Failed to send verification email:', error);
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