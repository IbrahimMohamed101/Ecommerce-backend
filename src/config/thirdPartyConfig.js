const ThirdParty = require("supertokens-node/recipe/thirdparty");
const User = require('../models/User');

module.exports = ThirdParty.init({
    signInAndUpFeature: {
        providers: [
            // Google OAuth Configuration
            {
                config: {
                    thirdPartyId: "google",
                    clients: [{
                        clientId: process.env.GOOGLE_CLIENT_ID,
                        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                        scope: [
                            'https://www.googleapis.com/auth/userinfo.email',
                            'https://www.googleapis.com/auth/userinfo.profile'
                        ]
                    }]
                }
            },
            // Twitter OAuth Configuration
            {
                config: {
                    thirdPartyId: "twitter",
                    clients: [{
                        clientId: process.env.TWITTER_CLIENT_ID,
                        clientSecret: process.env.TWITTER_CLIENT_SECRET
                    }]
                }
            },
            {
                config: {
                    thirdPartyId: "facebook",
                    clients: [{
                        clientId: process.env.FACEBOOK_CLIENT_ID,
                        clientSecret: process.env.FACEBOOK_CLIENT_SECRET
                    }]
                }
            }
        ]
    },
    override: {
        apis: (originalImplementation) => {
            return {
                ...originalImplementation,
                signInUpPOST: async function (input) {
                    const response = await originalImplementation.signInUpPOST(input);
                    
                    if (response.status === "OK") {
                        if (response.createdNewUser) {
                            const newUser = new User({
                                supertokensId: response.user.id,
                                email: response.user.email,
                                role: 'customer',
                                isActive: true,
                                isEmailVerified: true,
                                profile: {
                                    firstName: response.user.firstName || '',
                                    lastName: response.user.lastName || '',
                                    phone: '',
                                    avatar: response.user.picture || ''
                                },
                                thirdParty: {
                                    provider: input.thirdPartyId,
                                    providerId: response.user.thirdParty.userId
                                },
                                preferences: {
                                    notifications: {
                                        email: true,
                                        sms: false,
                                        push: true
                                    },
                                    language: 'ar',
                                    currency: 'EGP'
                                }
                            });

                            await newUser.save();
                        } else {
                            await User.findOneAndUpdate(
                                { supertokensId: response.user.id },
                                { 
                                    lastLogin: new Date(),
                                    'activityLog.lastSeen': new Date()
                                }
                            );
                        }
                    }
                    
                    return response;
                }
            };
        }
    }
});