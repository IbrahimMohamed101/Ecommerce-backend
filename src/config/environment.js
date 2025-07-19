    require('dotenv').config();

    const config = {
    development: {
        port: process.env.PORT || 3000,
        mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_dev',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
        },
        redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null
        },
        supertokens: {
        connectionURI: process.env.SUPERTOKENS_CONNECTION_URI,
        apiKey: process.env.SUPERTOKENS_API_KEY,
        appInfo: {
            appName: process.env.SUPERTOKENS_APP_NAME || "ecommerce-app",
            apiDomain: process.env.APP_URL,
            websiteDomain: process.env.CLIENT_URL,
            apiBasePath: "/auth",
            websiteBasePath: "/auth"
        },
        // Explicitly set the app ID and tenant ID
        appId: process.env.SUPERTOKENS_APP_ID || "public",
        tenantId: "public",
        recipeList: [
            require("supertokens-node/recipe/emailpassword").init(),
            require("supertokens-node/recipe/session").init()
        ]
        },
        jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        expiresIn: '7d'
        },
        email: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
        }
    },
    production: {
        port: process.env.PORT || 3000,
        mongodb: {
        uri: process.env.MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
        },
        redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
        },
        supertokens: {
        connectionURI: process.env.SUPERTOKENS_CONNECTION_URI,
        apiKey: process.env.SUPERTOKENS_API_KEY,
        appInfo: {
            appName: process.env.APP_NAME || "ecommerce-app",
            apiDomain: process.env.APP_URL,
            websiteDomain: process.env.CLIENT_URL,
            apiBasePath: "/auth",
            websiteBasePath: "/auth"
        }
        },
        jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d'
        },
        email: {
        service: process.env.EMAIL_SERVICE,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
        }
    }
    };

    const env = process.env.NODE_ENV || 'development';
    module.exports = config[env];