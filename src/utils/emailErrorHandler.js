const Logger = require('./logger');

class EmailErrorHandler {
    static handleEmailError(error) {
        Logger.error('❌ Email sending failed:', {
            name: error.name,
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode
        });

        switch (error.code) {
            case 'EAUTH':
                this.handleAuthError();
                break;
            case 'ECONNECTION':
                this.handleConnectionError();
                break;
            case 'EENVELOPE':
                this.handleEnvelopeError();
                break;
            case 'EMESSAGE':
                this.handleMessageError();
                break;
            case 'ETIMEDOUT':
                this.handleTimeoutError();
                break;
            default:
                this.handleGenericError(error);
        }
    }

    static handleAuthError() {
        Logger.error('🔐 Authentication failed - Check your credentials:');
        Logger.error('   - Make sure you\'re using an App Password (not your regular password)');
        Logger.error('   - Enable 2-factor authentication on your Google account');
        Logger.error('   - Generate an App Password from: https://myaccount.google.com/apppasswords');
        Logger.error('   - Verify SMTP_USER and SMTP_PASSWORD environment variables');
    }

    static handleConnectionError() {
        Logger.error('🌐 Connection to SMTP server failed:');
        Logger.error('   - Check your internet connection');
        Logger.error('   - Verify firewall settings');
        Logger.error('   - Ensure port 465 is not blocked');
        Logger.error('   - Try using port 587 with STARTTLS');
    }

    static handleEnvelopeError() {
        Logger.error('📧 Email address issue:');
        Logger.error('   - Verify the recipient email address format');
        Logger.error('   - Check if the domain exists');
        Logger.error('   - Ensure no special characters in email');
    }

    static handleMessageError() {
        Logger.error('📝 Message content issue:');
        Logger.error('   - Check email content for problems');
        Logger.error('   - Verify HTML format is valid');
        Logger.error('   - Check for suspicious content that might be flagged as spam');
    }

    static handleTimeoutError() {
        Logger.error('⏰ Connection timeout:');
        Logger.error('   - Network connection is too slow');
        Logger.error('   - SMTP server is not responding');
        Logger.error('   - Try increasing timeout settings');
    }

    static handleGenericError(error) {
        Logger.error('❓ Unexpected error occurred:');
        Logger.error('   - Error:', error.message);
        Logger.error('   - Check SMTP server status');
        Logger.error('   - Verify all configuration settings');
    }

    static createErrorResponse(error) {
        return {
            success: false,
            error: {
                code: error.code || 'UNKNOWN_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }

    static isRetryableError(error) {
        const retryableCodes = ['ECONNECTION', 'ETIMEDOUT', 'ESOCKET'];
        return retryableCodes.includes(error.code);
    }
}

module.exports = EmailErrorHandler;