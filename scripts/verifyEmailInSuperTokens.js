const EmailVerification = require('supertokens-node/recipe/emailverification');
const dotenv = require('dotenv');
dotenv.config();

async function verifyEmail(email) {
    try {
        // First, check if email is already verified in SuperTokens
        const isVerified = await EmailVerification.isEmailVerified(
            'public', // tenantId
            email,
            'public'  // userContext
        );

        if (isVerified) {
            console.log('Email is already verified in SuperTokens');
            return;
        }

        // If not verified, verify it
        console.log('Verifying email in SuperTokens...');
        await EmailVerification.verifyEmailUsingToken(
            'public', // tenantId
            email,
            'public'  // userContext
        );

        console.log('Email successfully verified in SuperTokens');
    } catch (error) {
        console.error('Error verifying email in SuperTokens:', error.message);
        if (error.message.includes('invalid token')) {
            console.log('Generating new verification token...');
            try {
                // If token is invalid, generate a new one and verify
                const response = await EmailVerification.generateEmailVerificationToken('public', email);
                await EmailVerification.verifyEmailUsingToken('public', response.token);
                console.log('Email successfully verified with new token');
            } catch (innerError) {
                console.error('Failed to verify with new token:', innerError.message);
            }
        }
    }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
    console.error('Please provide an email address as an argument');
    process.exit(1);
}

verifyEmail(email).then(() => process.exit(0));
