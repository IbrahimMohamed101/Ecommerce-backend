const logger = require('../utils/logger');
const { initSupertokens } = require('../config/supertokens');
const connectDB = require('../config/database');

function initialize() {
    // Initialize SuperTokens
    logger.info('Initializing SuperTokens...');
    initSupertokens();
    logger.info('✅ SuperTokens initialized');

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    connectDB();
    logger.info('✅ MongoDB connected');
}

module.exports = { initialize };
