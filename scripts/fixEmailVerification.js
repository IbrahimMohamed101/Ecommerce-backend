require('dotenv').config();
const supertokens = require('supertokens-node');
const EmailVerification = require('supertokens-node/recipe/emailverification');
const Session = require('supertokens-node/recipe/session');
const User = require('../src/models/User');
const mongoose = require('mongoose');

// Initialize SuperTokens
supertokens.init({
    framework: "express",
    supertokens: {
        connectionURI: process.env.SUPERTOKENS_CONNECTION_URI,
        apiKey: process.env.SUPERTOKENS_API_KEY,
    },
    appInfo: {
        appName: "E-Commerce",
        apiDomain: process.env.API_DOMAIN || 'http://localhost:3001',
        websiteDomain: process.env.WEBSITE_DOMAIN || 'http://localhost:3000',
        apiBasePath: '/auth',
        websiteBasePath: '/auth'
    },
    recipeList: [
        EmailVerification.init({
            mode: "OPTIONAL"
        }),
        Session.init()
    ]
});

async function verifyEmail(email) {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');

        // 1. Update user in our database
        const user = await User.findOneAndUpdate(
            { email },
            { 
                isEmailVerified: true,
                emailVerificationToken: undefined,
                emailVerificationExpires: undefined,
                emailVerificationSent: true 
            },
            { new: true }
        );

        if (!user) {
            console.error('❌ User not found');
            return;
        }

        console.log('✅ Updated user in database:', user.email);

        // 2. Verify email in SuperTokens
        try {
            // First check if already verified
            const isVerified = await EmailVerification.isEmailVerified('public', email, 'public');
            
            if (isVerified) {
                console.log('✅ Email is already verified in SuperTokens');
                return;
            }

            // If not verified, create and verify a token
            console.log('Generating verification token...');
            const token = await EmailVerification.generateEmailVerificationToken('public', email, 'public');
            
            console.log('Verifying email with token...');
            await EmailVerification.verifyEmailUsingToken('public', token.token);
            
            console.log('✅ Email verified in SuperTokens');
        } catch (stError) {
            console.error('Error with SuperTokens verification:', stError.message);
            console.log('⚠️  Continuing with database update only');
        }

        // 3. Check if admin approval is needed
        if (user.vendorDetails?.storeStatus === 'pending') {
            console.log('\n⚠️  Account Status: Awaiting Admin Approval');
            console.log('Your email is verified but your vendor account is pending admin approval.');
            console.log('Please contact the administrator to approve your account.');
        } else {
            console.log('\n✅ Account is fully verified and approved!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Get email from command line
const email = process.argv[2];
if (!email) {
    console.error('Please provide an email address');
    process.exit(1);
}

verifyEmail(email);
