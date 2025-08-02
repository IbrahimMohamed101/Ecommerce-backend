const Logger = require('../utils/logger');

class EmailConfig {
    static getTransporterConfig() {
        const emailUser = process.env.SMTP_USER || 'hemaatar636@gmail.com';
        const emailPass = process.env.SMTP_PASSWORD || 'sslxcvbgimgqegva';
        
        if (!emailUser || !emailPass) {
            throw new Error('SMTP credentials are not properly configured');
        }

        return {
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: emailUser,
                pass: emailPass
            },
            pool: true,
            maxConnections: 3,
            maxMessages: 10,
            rateDelta: 1000,
            rateLimit: 5,
            debug: process.env.NODE_ENV === 'development',
            logger: {
                debug: (message) => Logger.debug(`📨 Nodemailer Debug:`, message),
                info: (message) => Logger.info(`ℹ️ Nodemailer Info:`, message),
                warn: (message) => Logger.warn(`⚠️ Nodemailer Warning:`, message),
                error: (message) => Logger.error(`❌ Nodemailer Error:`, message),
                fatal: (message) => Logger.error(`🔥 Nodemailer Fatal:`, message),
                trace: (message) => Logger.debug(`🔍 Nodemailer Trace:`, message)
            }
        };
    }

    static getFromAddress() {
        const fromName = process.env.EMAIL_FROM_NAME || 'متجر إلكتروني';
        const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'hemaatar636@gmail.com';
        return `"${fromName}" <${fromEmail}>`;
    }

    static validateCredentials() {
        const emailUser = process.env.SMTP_USER;
        const emailPass = process.env.SMTP_PASSWORD;
        
        return {
            isValid: !!(emailUser && emailPass),
            hasUser: !!emailUser,
            hasPass: !!emailPass,
            user: emailUser
        };
    }
}

module.exports = EmailConfig;