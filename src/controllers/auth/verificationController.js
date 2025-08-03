const logger = require('../../utils/logger');

/**
 * Handle verification success
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verificationSuccess = (req, res) => {
    logger.info('Email verification success page accessed');
    
    if (req.accepts('html')) {
        // For browser requests, render a success page
        res.send(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>تم التحقق من البريد الإلكتروني بنجاح</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px; 
                        background-color: #f5f5f5;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background: white; 
                        padding: 40px; 
                        border-radius: 10px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .success-icon { 
                        color: #4CAF50; 
                        font-size: 60px; 
                        margin-bottom: 20px;
                    }
                    h1 { 
                        color: #333; 
                        margin-bottom: 20px;
                    }
                    p { 
                        color: #666; 
                        margin-bottom: 30px;
                        font-size: 18px;
                    }
                    .btn {
                        display: inline-block;
                        padding: 12px 30px;
                        background-color: #4CAF50;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        transition: background-color 0.3s;
                    }
                    .btn:hover {
                        background-color: #45a049;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success-icon">✓</div>
                    <h1>تم التحقق من بريدك الإلكتروني بنجاح!</h1>
                    <p>شكراً لك على التحقق من بريدك الإلكتروني. يمكنك الآن تسجيل الدخول إلى حسابك.</p>
                    <a href="${process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.CLIENT_URL || 'https://ecommerce-backend-l7a2.onrender.com'}/login" class="btn">تسجيل الدخول</a>
                </div>
            </body>
            </html>
        `);
    } else {
        // For API requests, return JSON
        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            redirect: `${process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.CLIENT_URL || 'https://ecommerce-backend-l7a2.onrender.com'}/login`
        });
    }
};

/**
 * Handle verification error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verificationError = (req, res) => {
    const { error } = req.query;
    logger.warn('Email verification error page accessed', { error });
    
    if (req.accepts('html')) {
        // For browser requests, render an error page
        res.status(400).send(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>خطأ في التحقق من البريد الإلكتروني</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px; 
                        background-color: #f5f5f5;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background: white; 
                        padding: 40px; 
                        border-radius: 10px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .error-icon { 
                        color: #f44336; 
                        font-size: 60px; 
                        margin-bottom: 20px;
                    }
                    h1 { 
                        color: #333; 
                        margin-bottom: 20px;
                    }
                    .error-message { 
                        color: #f44336; 
                        margin: 20px 0;
                        padding: 15px;
                        background-color: #ffebee;
                        border-radius: 5px;
                        text-align: right;
                        direction: rtl;
                    }
                    p { 
                        color: #666; 
                        margin: 20px 0;
                        font-size: 16px;
                    }
                    .btn {
                        display: inline-block;
                        padding: 12px 30px;
                        background-color: #2196F3;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        margin: 10px 5px;
                        transition: background-color 0.3s;
                    }
                    .btn:hover {
                        background-color: #0b7dda;
                    }
                    .btn-outline {
                        background: transparent;
                        border: 2px solid #2196F3;
                        color: #2196F3;
                    }
                    .btn-outline:hover {
                        background-color: #f1f1f1;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="error-icon">✗</div>
                    <h1>حدث خطأ أثناء التحقق من بريدك الإلكتروني</h1>
                    ${error ? `<div class="error-message">${error}</div>` : ''}
                    <p>عذراً، حدث خطأ أثناء محاولة التحقق من بريدك الإلكتروني. قد يكون الرابط غير صالح أو منتهي الصلاحية.</p>
                    <div>
                        <a href="${process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.CLIENT_URL || 'https://ecommerce-backend-l7a2.onrender.com'}/resend-verification" class="btn">إعادة إرسال بريد التحقق</a>
                        <a href="${process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || process.env.WEBSITE_DOMAIN || process.env.CLIENT_URL || 'https://ecommerce-backend-l7a2.onrender.com'}/contact-support" class="btn btn-outline">اتصل بالدعم الفني</a>
                    </div>
                </div>
            </body>
            </html>
        `);
    } else {
        // For API requests, return JSON
        res.status(400).json({
            success: false,
            message: error || 'Email verification failed',
            error: {
                code: 'VERIFICATION_FAILED',
                message: error || 'Email verification failed. The link may be invalid or expired.'
            }
        });
    }
};

module.exports = {
    verificationSuccess,
    verificationError
};
