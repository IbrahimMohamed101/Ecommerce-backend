// Enable better error handling
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(error.name, error.message);
    console.error(error.stack);
    process.exit(1);
});

let server; // Declare server variable to hold the server instance

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

const app = require('./src/app');
const config = require('./src/config/environment');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = config.port || 3000;

console.log('🔍 Environment:', process.env.NODE_ENV || 'development');
console.log('📡 Connecting to MongoDB...');

// Import seeders
const runRoleSeeder = require('./src/database/seeders/init-roles');
const runSuperAdminSeeder = require('./src/database/seeders/createSuperAdmin');

// Connect to database and run seeders
const initializeApp = async () => {
    try {
        await connectDB();
        logger.info('✅ MongoDB connected successfully');
        
        // Run seeders
        logger.info('🌱 Running database seeders...');
        await runRoleSeeder();
        await runSuperAdminSeeder();
        logger.info('✅ Database seeders completed successfully');
    } catch (error) {
        logger.error('❌ Error initializing application:', error);
        process.exit(1);
    }
};

// Initialize the application before starting the server
const startServer = async () => {
    try {
        await initializeApp();
        
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            console.log(`🔐 Auth API: http://localhost:${PORT}/auth`);
        }).on('error', (err) => {
            console.error('❌ Failed to start server:', err);
            process.exit(1);
        });

        return server;
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        process.exit(1);
    }
};

startServer().then((srv) => {
    server = srv;
}).catch((err) => {
    console.error('❌ Error starting server:', err);
    process.exit(1);
});

// Graceful shutdown
const shutdown = async () => {
    console.log('🛑 Shutting down gracefully...');
    if (server) {
        server.close(() => {
            console.log('✅ Process terminated');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('❌ Forcing shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => {
    console.log('SIGTERM received');
    shutdown();
});

process.on('SIGINT', () => {
    console.log('SIGINT received');
    shutdown();
});
