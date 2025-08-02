const Logger = require('./logger');

class EmailValidator {
    static validateEmailAddress(email) {
        if (!email) {
            throw new Error('Email address is required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email address format');
        }

        return true;
    }

    static validateEmailOptions(options) {
        const { to, subject, html } = options;

        if (!to) {
            throw new Error('Recipient email address is required');
        }

        if (!subject) {
            throw new Error('Email subject is required');
        }

        if (!html) {
            throw new Error('Email content is required');
        }

        this.validateEmailAddress(to);
        return true;
    }

    static sanitizeEmail(email) {
        return email ? email.trim().toLowerCase() : '';
    }

    static maskEmailForLogging(email) {
        if (!email) return 'MISSING';
        
        const atIndex = email.indexOf('@');
        if (atIndex <= 3) return email.substring(0, 1) + '***' + email.substring(atIndex);
        
        return email.substring(0, 3) + '***' + email.substring(atIndex);
    }

    static createLogContext(email, additionalData = {}) {
        return {
            email: this.maskEmailForLogging(email),
            timestamp: new Date().toISOString(),
            service: 'Gmail SMTP',
            env: process.env.NODE_ENV || 'development',
            port: 465,
            secure: true,
            ...additionalData
        };
    }
}

module.exports = EmailValidator;