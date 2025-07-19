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
                apiDomain: process.env.APP_URL || 'http://localhost:3000',
                websiteDomain: process.env.CLIENT_URL || 'http://localhost:3000',
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