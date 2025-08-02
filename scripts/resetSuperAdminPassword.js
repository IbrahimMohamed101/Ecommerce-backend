require('dotenv').config({ path: '.env' });
const supertokens = require('supertokens-node');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const config = require('../src/config/environment');

// Initialize SuperTokens with the same configuration as in the main app
supertokens.init({
    framework: "express",
    supertokens: {
        connectionURI: config.supertokens.connectionURI,
        apiKey: config.supertokens.apiKey,
    },
    appInfo: config.supertokens.appInfo,
    recipeList: [
        EmailPassword.init(),
        require('supertokens-node/recipe/session').init(),
    ]
});

async function resetSuperAdminPassword() {
    const { SUPER_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } = process.env;

    if (!SUPER_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) {
        console.error('❌ Missing SUPER_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD in .env');
        process.exit(1);
    }

    try {
        console.log(`🔄 Attempting to reset password for ${SUPER_ADMIN_EMAIL}...`);
        
        // First, try to sign in to check if the user exists
        try {
            // Try to sign in with the current password
            const signInResponse = await EmailPassword.signIn("public", SUPER_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
            if (signInResponse.status === "OK") {
                console.log('✅ User exists and password is already set to the default password');
                console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
                console.log(`Password: ${DEFAULT_ADMIN_PASSWORD}`);
                return;
            }
        } catch (signInError) {
            // If sign in fails, continue with password reset
            console.log('ℹ️ Current password is not working, attempting to create or update user...');
        }

        // Check if user exists
        try {
            const user = await EmailPassword.getUserByEmail("public", SUPER_ADMIN_EMAIL);
            
            if (user) {
                // User exists, update the password
                console.log('🔄 User exists, updating password...');
                await EmailPassword.updateEmailOrPassword({
                    userId: user.id,
                    password: DEFAULT_ADMIN_PASSWORD
                });
                console.log('✅ Password updated successfully!');
            } else {
                // User doesn't exist, create a new one
                console.log('🔄 User does not exist, creating new super admin...');
                const signUpResponse = await EmailPassword.signUp("public", SUPER_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
                if (signUpResponse.status === "OK") {
                    console.log('✅ Super admin created successfully!');
                } else {
                    console.error('❌ Failed to create super admin:', signUpResponse);
                    return;
                }
            }
            
            console.log('✅ Password reset successful!');
            console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
            console.log(`Password: ${DEFAULT_ADMIN_PASSWORD}`);
            
        } catch (error) {
            console.error('❌ Error during password reset:', error);
        }
    } catch (error) {
        console.error('❌ Error resetting password:', error);
    }
}

resetSuperAdminPassword().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
