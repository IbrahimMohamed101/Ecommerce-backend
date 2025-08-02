    class EmailTemplates {
        static getVerificationEmailHTML(verificationLink) {
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

        static getVerificationEmailText(verificationLink) {
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

        static getActivationEmailHTML(name, activationLink) {
            return `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333;">مرحباً ${name}،</h2>
                    <p>شكراً لتسجيلك في لوحة تحكم E-Commerce. يرجى النقر على الزر أدناه لتفعيل حسابك:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${activationLink}" 
                        style="display: inline-block; padding: 12px 24px; 
                                background-color: #4CAF50; 
                                color: white; 
                                text-decoration: none; 
                                border-radius: 4px;
                                font-weight: bold;">
                            تفعيل الحساب
                        </a>
                    </div>
                    <p>أو قم بنسخ الرابط التالي ولصقه في المتصفح:</p>
                    <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">${activationLink}</p>
                    <p>إذا لم تقم بطلب إنشاء هذا الحساب، يرجى تجاهل هذه الرسالة.</p>
                    <hr>
                    <p style="color: #777; font-size: 0.9em;">مع أطيب التحيات،<br>فريق E-Commerce</p>
                </div>
            `;
        }

        static getPasswordResetEmailHTML(name, resetLink) {
            return `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333;">مرحباً ${name}،</h2>
                    <p>تلقينا طلباً لإعادة تعيين كلمة مرور حسابك. انقر على الزر أدناه لإعادة تعيين كلمة المرور:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                        style="display: inline-block; padding: 12px 24px; 
                                background-color: #2196F3; 
                                color: white; 
                                text-decoration: none; 
                                border-radius: 4px;
                                font-weight: bold;">
                            إعادة تعيين كلمة المرور
                        </a>
                    </div>
                    <p>أو قم بنسخ الرابط التالي ولصقه في المتصفح:</p>
                    <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">${resetLink}</p>
                    <p style="color: #f44336; font-weight: bold;">هذا الرابط صالح لمدة 24 ساعة فقط.</p>
                    <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.</p>
                    <hr>
                    <p style="color: #777; font-size: 0.9em;">مع أطيب التحيات،<br>فريق E-Commerce</p>
                </div>
            `;
        }
    }

    module.exports = EmailTemplates;