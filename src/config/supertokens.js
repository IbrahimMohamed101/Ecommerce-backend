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
                apiDomain: process.env.API_DOMAIN || process.env.APP_URL,
                websiteDomain: process.env.WEBSITE_DOMAIN || process.env.APP_URL,
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