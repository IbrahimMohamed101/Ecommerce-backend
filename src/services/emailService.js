const nodemailer = require('nodemailer');
const Logger = require('../utils/logger');
const EmailConfig = require('../config/emailConfig');
const EmailTemplates = require('../templates/emailTemplates');
const EmailValidator = require('../utils/emailValidator');
const EmailErrorHandler = require('../utils/emailErrorHandler');

class EmailService {
    constructor() {
        Logger.info('Initializing EmailService...');
        this.transporter = null;
        this.isReady = false;
        this.retryAttempts = 3;
        this.retryDelay = 2000; // 2 seconds
        this.initTransporter();
    }

    async initTransporter() {
        try {
            Logger.info('🚀 Initializing Gmail SMTP transporter...');
            
            // Validate credentials first
            const credentialCheck = EmailConfig.validateCredentials();
            if (!credentialCheck.isValid) {
                const error = new Error('SMTP credentials are not properly configured');
                Logger.error('❌ SMTP Configuration Error:', {
                    error: error.message,
                    hasUser: credentialCheck.hasUser,
                    hasPass: credentialCheck.hasPass,
                    env: process.env.NODE_ENV || 'development'
                });
                throw error;
            }
            
            Logger.info(`📧 Using email account: ${credentialCheck.user}`);
            
            // Get transporter configuration
            const transporterConfig = EmailConfig.getTransporterConfig();
            
            Logger.debug('Transporter configuration:', {
                ...transporterConfig,
                auth: { user: credentialCheck.user, pass: '***' }
            });
            
            this.transporter = nodemailer.createTransport(transporterConfig);
            
            // Verify connection
            await this.verifyConnection();
            this.isReady = true;
            Logger.info('✅ SMTP Transporter initialized and verified successfully');

        } catch (error) {
            Logger.error('❌ Failed to initialize email transporter:', {
                error: error.message,
                stack: error.stack,
                code: error.code,
                command: error.command,
                response: error.response
            });
            this.isReady = false;
            throw error;
        }
    }

    async verifyConnection() {
        try {
            const isConnected = await this.transporter.verify();
            if (isConnected) {
                Logger.info('✅ SMTP Server is ready to take our messages');
                return true;
            }
            return false;
        } catch (error) {
            Logger.error('❌ SMTP Connection verification failed:', error);
            EmailErrorHandler.handleEmailError(error);
            return false;
        }
    }

    async ensureReady() {
        if (!this.isReady || !this.transporter) {
            Logger.info('Email service not ready, reinitializing...');
            try {
                await this.initTransporter();
                Logger.info('✅ Email transporter reinitialized successfully');
            } catch (error) {
                Logger.error('❌ Failed to reinitialize email transporter:', error);
                throw error;
            }
        }
    }

    async sendEmailWithRetry(mailOptions, attempt = 1) {
        try {
            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
                response: info.response,
                envelope: info.envelope,
                previewUrl: nodemailer.getTestMessageUrl(info) || null
            };
        } catch (error) {
            if (attempt < this.retryAttempts && EmailErrorHandler.isRetryableError(error)) {
                Logger.warn(`⚠️ Retry attempt ${attempt}/${this.retryAttempts} after ${this.retryDelay}ms`);
                await this.delay(this.retryDelay);
                return this.sendEmailWithRetry(mailOptions, attempt + 1);
            }
            throw error;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Send a generic email
     * @param {Object} options - Email options
     * @param {string} options.to - Recipient email address
     * @param {string} options.subject - Email subject
     * @param {string} options.html - HTML content of the email
     * @param {string} [options.text] - Plain text content of the email (optional)
     * @param {Array} [options.attachments] - Email attachments (optional)
     */
    async sendEmail({ to, subject, html, text, attachments = [] }) {
        await this.ensureReady();

        try {
            // Validate input
            EmailValidator.validateEmailOptions({ to, subject, html });

            const mailOptions = {
                from: EmailConfig.getFromAddress(),
                to: EmailValidator.sanitizeEmail(to),
                subject,
                html,
                text: text || html.replace(/<[^>]*>?/gm, ''),
                attachments
            };

            Logger.debug('Sending email with options:', {
                to: EmailValidator.maskEmailForLogging(to),
                subject,
                hasHtml: !!html,
                hasText: !!text,
                attachmentsCount: attachments.length
            });

            const result = await this.sendEmailWithRetry(mailOptions);
            
            Logger.info(`✅ Email sent to ${EmailValidator.maskEmailForLogging(to)} with message ID: ${result.messageId}`);
            return result;

        } catch (error) {
            Logger.error('❌ Failed to send email:', {
                error: error.message,
                to: EmailValidator.maskEmailForLogging(to),
                subject
            });
            EmailErrorHandler.handleEmailError(error);
            throw error;
        }
    }

    /**
     * Send an email verification email
     * @param {string} email - Recipient email address
     * @param {string} verificationLink - Verification link
     */
    async sendVerificationEmail(email, verificationLink) {
        Logger.info('📤 Preparing to send verification email to:', EmailValidator.maskEmailForLogging(email));
        
        const logContext = EmailValidator.createLogContext(email, {
            hasVerificationLink: !!verificationLink
        });
        
        Logger.info('📤 Attempting to send verification email', logContext);
        
        // Validate inputs
        if (!email || !verificationLink) {
            const error = new Error('Email and verification link are required');
            Logger.error('❌ Validation error', { 
                ...logContext, 
                error: error.message 
            });
            throw error;
        }

        try {
            const result = await this.sendEmail({
                to: email,
                subject: 'تأكيد البريد الإلكتروني - Email Verification',
                html: EmailTemplates.getVerificationEmailHTML(verificationLink),
                text: EmailTemplates.getVerificationEmailText(verificationLink)
            });

            Logger.info('✅ Verification email sent successfully:', {
                messageId: result.messageId,
                to: EmailValidator.maskEmailForLogging(email)
            });
            
            return result;
            
        } catch (error) {
            Logger.error('❌ Failed to send verification email:', {
                error: error.message,
                to: EmailValidator.maskEmailForLogging(email)
            });
            throw error;
        }
    }

    /**
     * Send an account activation email
     * @param {string} to - Recipient email address
     * @param {string} name - Recipient's name
     * @param {string} activationLink - Activation link for the account
     */
    async sendActivationEmail(to, name, activationLink) {
        try {
            const result = await this.sendEmail({
                to,
                subject: 'تفعيل حسابك - E-Commerce Admin',
                html: EmailTemplates.getActivationEmailHTML(name, activationLink)
            });

            Logger.info(`✅ تم إرسال بريد التفعيل بنجاح إلى ${EmailValidator.maskEmailForLogging(to)}`);
            return result;
        } catch (error) {
            Logger.error('❌ فشل إرسال بريد التفعيل:', error);
            throw error;
        }
    }

    /**
     * Send a password reset email
     * @param {string} email - Recipient email address
     * @param {string} name - Recipient's name
     * @param {string} resetLink - Password reset link
     */
    async sendPasswordResetEmail(email, name, resetLink) {
        try {
            const result = await this.sendEmail({
                to: email,
                subject: 'إعادة تعيين كلمة المرور - Password Reset',
                html: EmailTemplates.getPasswordResetEmailHTML(name, resetLink)
            });

            Logger.info(`✅ Password reset email sent successfully to ${EmailValidator.maskEmailForLogging(email)}`);
            return result;
        } catch (error) {
            Logger.error('❌ Failed to send password reset email:', error);
            throw error;
        }
    }

    // Health check method
    async healthCheck() {
        try {
            await this.ensureReady();
            const isConnected = await this.verifyConnection();
            return {
                status: isConnected ? 'healthy' : 'unhealthy',
                isReady: this.isReady,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Create a singleton instance
const emailService = new EmailService();

module.exports = emailService;