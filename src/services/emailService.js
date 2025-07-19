const nodemailer = require('nodemailer');

// Simple console logger
const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    debug: (...args) => process.env.DEBUG && console.log('[DEBUG]', ...args)
};

// Always use real email in production and development
const isProduction = process.env.NODE_ENV === 'production';

class EmailService {
    constructor() {
        logger.info('Initializing EmailService...');
        this.transporter = null;
        this.isReady = false;
        this.initTransporter();
    }

    async initTransporter() {
        try {
            logger.info('🚀 Initializing Gmail SMTP transporter...');
            
            // Get credentials from environment
            const emailUser = process.env.SMTP_USER || 'hemaatar636@gmail.com';
            const emailPass = process.env.SMTP_PASSWORD || 'sslxcvbgimgqegva';
            
            if (!emailUser || !emailPass) {
                throw new Error('SMTP credentials are not properly configured');
            }
            
            logger.info(`📧 Using email account: ${emailUser}`);
            
            // Create transporter with Gmail SMTP
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                port: 465, // Use SSL port
                secure: true, // true for 465, false for other ports
                auth: {
                    user: emailUser,
                    pass: emailPass
                },
                // Gmail requires these settings
                pool: true,
                maxConnections: 3,
                maxMessages: 10,
                rateDelta: 1000, // 1 second between emails
                rateLimit: 5, // max 5 emails per rateDelta
                // Debug and logging
                debug: !isProduction,
                logger: !isProduction ? {
                    debug: (message) => logger.debug(`📨 Nodemailer Debug:`, message),
                    info: (message) => logger.info(`ℹ️ Nodemailer Info:`, message),
                    warn: (message) => logger.info(`⚠️ Nodemailer Warning:`, message),
                    error: (message) => logger.error(`❌ Nodemailer Error:`, message),
                    fatal: (message) => logger.error(`🔥 Nodemailer Fatal:`, message),
                    trace: (message) => logger.debug(`🔍 Nodemailer Trace:`, message)
                } : false
            });
            
            // Verify connection
            await this.verifyConnection();
            this.isReady = true;

        } catch (error) {
            logger.error('Failed to initialize email transporter:', error);
            this.isReady = false;
            throw error;
        }
    }

    async verifyConnection() {
        try {
            const isConnected = await this.transporter.verify();
            if (isConnected) {
                logger.info('✅ SMTP Server is ready to take our messages');
                return true;
            }
            return false;
        } catch (error) {
            logger.error('❌ SMTP Connection Error:', error);
            throw error;
        }
    }

    async ensureReady() {
        if (!this.isReady || !this.transporter) {
            logger.info('Email service not ready, reinitializing...');
            await this.initTransporter();
        }
    }

    async sendVerificationEmail(email, verificationLink) {
        const logContext = {
            email: email ? email.substring(0, 3) + '***' + email.substring(email.indexOf('@')) : 'MISSING',
            hasVerificationLink: !!verificationLink,
            timestamp: new Date().toISOString(),
            service: 'Gmail SMTP',
            port: 465,
            secure: true
        };
        
        logger.info('📤 Attempting to send verification email', logContext);
        
        // Validate inputs
        if (!email || !verificationLink) {
            const error = new Error('Email and verification link are required');
            logger.error('❌ Validation error', { 
                ...logContext, 
                error: error.message,
                stack: error.stack 
            });
            throw error;
        }
        
        // Ensure email service is properly initialized
        if (!this.transporter) {
            logger.error('❌ Email transporter not initialized');
            await this.initTransporter();
        }

        // Ensure email service is ready
        await this.ensureReady();
        
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'متجر إلكتروني'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER || 'hemaatar636@gmail.com'}>`,
            to: email,
            subject: 'تأكيد البريد الإلكتروني - Email Verification',
            html: this.getVerificationEmailHTML(verificationLink),
            text: this.getVerificationEmailText(verificationLink)
        };

        logger.info('Mail options prepared:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            hasHtml: !!mailOptions.html,
            hasText: !!mailOptions.text
        });

        try {
            logger.info('📮 Sending email via Gmail SMTP...');
            const info = await this.transporter.sendMail(mailOptions);
            
            const result = { 
                success: true, 
                messageId: info.messageId,
                response: info.response,
                envelope: info.envelope,
                previewUrl: nodemailer.getTestMessageUrl(info) || null
            };
            
            logger.info('✅ Email sent successfully:', {
                messageId: info.messageId,
                response: info.response,
                accepted: info.accepted,
                rejected: info.rejected
            });
            
            return result;
            
        } catch (error) {
            logger.error('❌ Failed to send email:', {
                name: error.name,
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode
            });
            
            // Provide specific error guidance
            this.handleEmailError(error);
            
            throw error;
        }
    }

    handleEmailError(error) {
        if (error.code === 'EAUTH') {
            logger.error('🔐 Authentication failed - Check your credentials:');
            logger.error('   - Make sure you\'re using an App Password (not your regular password)');
            logger.error('   - Enable 2-factor authentication on your Google account');
            logger.error('   - Generate an App Password from: https://myaccount.google.com/apppasswords');
        } else if (error.code === 'ECONNECTION') {
            logger.error('🌐 Connection to SMTP server failed:');
            logger.error('   - Check your internet connection');
            logger.error('   - Verify firewall settings');
        } else if (error.code === 'EENVELOPE') {
            logger.error('📧 Email address issue:');
            logger.error('   - Verify the recipient email address');
        } else if (error.code === 'EMESSAGE') {
            logger.error('📝 Message content issue:');
            logger.error('   - Check email content for problems');
        }
    }

    getVerificationEmailHTML(verificationLink) {
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>تأكيد البريد الإلكتروني</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #333; margin: 0;">مرحباً بك في متجرنا الإلكتروني</h1>
                        <p style="color: #666; font-size: 16px;">Welcome to our E-commerce Store</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                            شكراً لتسجيلك معنا. يرجى النقر على الزر أدناه لتأكيد بريدك الإلكتروني:
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                            Thank you for registering with us. Please click the button below to verify your email:
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 25px; 
                                  font-weight: bold; 
                                  display: inline-block;
                                  font-size: 16px;
                                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                            تأكيد البريد الإلكتروني / Verify Email
                        </a>
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #856404;">
                            إذا لم يعمل الزر، انسخ الرابط التالي والصقه في متصفحك:
                        </p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #856404;">
                            If the button doesn't work, copy and paste this link in your browser:
                        </p>
                        <p style="word-break: break-all; color: #0066cc; font-size: 12px; margin: 10px 0 0 0;">
                            ${verificationLink}
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    
                    <div style="text-align: center;">
                        <p style="color: #888; font-size: 12px; margin: 0;">
                            إذا لم تقم بطلب هذا البريد الإلكتروني، فيمكنك تجاهله بأمان.
                        </p>
                        <p style="color: #888; font-size: 12px; margin: 5px 0 0 0;">
                            If you didn't request this email, you can safely ignore it.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getVerificationEmailText(verificationLink) {
        return `
مرحباً بك في متجرنا الإلكتروني
Welcome to our E-commerce Store

شكراً لتسجيلك معنا. لتأكيد بريدك الإلكتروني، يرجى زيارة الرابط التالي:
Thank you for registering with us. To verify your email, please visit the following link:

${verificationLink}

إذا لم تقم بطلب هذا البريد الإلكتروني، فيمكنك تجاهله بأمان.
If you didn't request this email, you can safely ignore it.
        `;
    }

    // Method to send password reset emails (if needed)
    async sendPasswordResetEmail(email, resetLink) {
        // Similar implementation for password reset
        // You can implement this later if needed
    }
}

// Create a singleton instance
const emailService = new EmailService();

module.exports = emailService;