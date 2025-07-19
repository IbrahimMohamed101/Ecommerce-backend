// Enable better error handling
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(error.name, error.message);
    console.error(error.stack);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err);
    server.close(() => {
        process.exit(1);
    });
});

const app = require('./src/app');
const config = require('./src/config/environment');

const PORT = config.port || 3000;

console.log('🔍 Environment:', process.env.NODE_ENV || 'development');
console.log('📡 Connecting to MongoDB...');

const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/auth`);
}).on('error', (err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});

// Graceful shutdown
const shutdown = async () => {
    console.log('🛑 Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });

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
