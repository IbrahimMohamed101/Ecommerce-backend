require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Role = require('../../models/Role');
const initializeRoles = require('../../initializers/roles');
const logger = require('../../utils/logger');

async function run() {
    try {
        logger.info('🔍 Starting roles initialization...');
        
        // Initialize roles
        await initializeRoles();
        
        logger.info('✅ Roles initialization completed successfully');
        return true;
    } catch (error) {
        logger.error('❌ Error initializing roles:', error);
        throw error;
    }
}

module.exports = run;
