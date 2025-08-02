const supertokens = require("supertokens-node");
const config = require('./environment');
const emailVerificationConfig = require('./emailVerificationConfig');
const emailPasswordConfig = require('./emailPasswordConfig');
const thirdPartyConfig = require('./thirdPartyConfig');
const sessionConfig = require('./sessionConfig');

let isInitialized = false;

const initSupertokens = () => {
    if (isInitialized) {
        console.log('SuperTokens already initialized');
        return;
    }

    console.log('Initializing SuperTokens...');
    try {
        supertokens.init({
            framework: "express",
            supertokens: {
                connectionURI: config.supertokens.connectionURI,
                apiKey: config.supertokens.apiKey,
            },
            appInfo: {
                ...config.supertokens.appInfo,
                // Use explicit domain configuration for production
                apiDomain: process.env.API_DOMAIN || process.env.APP_URL || 'https://ecommerce-backend-l7a2.onrender.com',
                websiteDomain: process.env.WEBSITE_DOMAIN || process.env.APP_URL || 'https://ecommerce-backend-l7a2.onrender.com',
                websiteBasePath: "/auth"
            },
            recipeList: [
                emailVerificationConfig,
                emailPasswordConfig,
                thirdPartyConfig,
                sessionConfig
            ]
        });
        isInitialized = true;
        console.log('✅ SuperTokens initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing SuperTokens:', error);
        throw error;
    }
};
module.exports = { initSupertokens };