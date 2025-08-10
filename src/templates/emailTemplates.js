class EmailTemplates {
    // Enhanced verification email with better accessibility and mobile responsiveness
    static getVerificationEmailHTML(verificationLink, userName = null) {
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="color-scheme" content="light dark">
                <title>تأكيد البريد الإلكتروني</title>
                <style>
                    @media (prefers-color-scheme: dark) {
                        .email-container { background-color: #1a1a1a !important; color: #ffffff !important; }
                        .email-content { background: #2d2d2d !important; }
                        .info-box { background: #333 !important; }
                        .warning-box { background: #4a3b00 !important; border-color: #ffd700 !important; }
                    }
                </style>
            </head>
            <body class="email-container" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; color: #333;">
                <div class="email-content" style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- Header with logo placeholder -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; color: white;">🛍️</div>
                        <h1 style="color: #333; margin: 0; font-size: 28px;">${userName ? `مرحباً ${userName}` : 'مرحباً بك'}</h1>
                        <h2 style="color: #667eea; margin: 10px 0 0 0; font-size: 20px;">مرحباً بك في متجرنا الإلكتروني</h2>
                        <p style="color: #666; font-size: 16px; margin: 5px 0 0 0;">Welcome to our E-commerce Store</p>
                    </div>
                    
                    <div class="info-box" style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #667eea;">
                        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                            شكراً لتسجيلك معنا. لإكمال عملية التسجيل، يرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه:
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                            Thank you for registering with us. To complete your registration, please verify your email by clicking the button below:
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${verificationLink}" 
                        role="button"
                        aria-label="تأكيد البريد الإلكتروني"
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                color: white; 
                                padding: 18px 40px; 
                                text-decoration: none; 
                                border-radius: 30px; 
                                font-weight: bold; 
                                display: inline-block;
                                font-size: 16px;
                                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                                transition: all 0.3s ease;
                                border: none;
                                cursor: pointer;">
                            ✉️ تأكيد البريد الإلكتروني / Verify Email
                        </a>
                    </div>
                    
                    <div class="warning-box" style="background: #fff3cd; border: 2px solid #ffeaa7; padding: 20px; border-radius: 10px; margin: 25px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #856404;">📋 تعليمات مهمة / Important Instructions</h4>
                        <p style="margin: 0; font-size: 14px; color: #856404; line-height: 1.5;">
                            إذا لم يعمل الزر أعلاه، انسخ الرابط التالي والصقه في متصفحك:
                        </p>
                        <p style="margin: 5px 0 10px 0; font-size: 14px; color: #856404;">
                            If the button above doesn't work, copy and paste this link in your browser:
                        </p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
                            <p style="word-break: break-all; color: #0066cc; font-size: 13px; margin: 0; font-family: monospace;">
                                ${verificationLink}
                            </p>
                        </div>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #856404;">
                            ⏰ هذا الرابط صالح لمدة 24 ساعة من وقت الإرسال
                            <br>
                            This link is valid for 24 hours from the time of sending
                        </p>
                    </div>
                    
                    <!-- Security notice -->
                    <div style="background: #e8f4f8; border: 2px solid #bee5eb; padding: 20px; border-radius: 10px; margin: 25px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #0c5460;">🔒 ملاحظة أمنية / Security Notice</h4>
                        <p style="margin: 0; font-size: 13px; color: #0c5460; line-height: 1.5;">
                            نحن لا نطلب منك أبداً كلمة المرور عبر البريد الإلكتروني. إذا تلقيت رسالة مشبوهة، يرجى التواصل معنا فوراً.
                        </p>
                        <p style="margin: 5px 0 0 0; font-size: 13px; color: #0c5460;">
                            We never ask for your password via email. If you receive a suspicious message, please contact us immediately.
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 2px solid #eee; margin: 40px 0;">
                    
                    <!-- Footer -->
                    <div style="text-align: center;">
                        <p style="color: #888; font-size: 14px; margin: 0; line-height: 1.5;">
                            إذا لم تقم بطلب هذا البريد الإلكتروني، فيمكنك تجاهله بأمان. لن يتم إنشاء أي حساب.
                        </p>
                        <p style="color: #888; font-size: 14px; margin: 5px 0 0 0;">
                            If you didn't request this email, you can safely ignore it. No account will be created.
                        </p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © 2025 E-Commerce Store. جميع الحقوق محفوظة / All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    static getVerificationEmailText(verificationLink, userName = null) {
        return `
${userName ? `مرحباً ${userName}` : 'مرحباً بك'}
${userName ? `Hello ${userName}` : 'Hello'}

مرحباً بك في متجرنا الإلكتروني
Welcome to our E-commerce Store

شكراً لتسجيلك معنا. لإكمال عملية التسجيل، يرجى تأكيد بريدك الإلكتروني بزيارة الرابط التالي:
Thank you for registering with us. To complete your registration, please verify your email by visiting the following link:

${verificationLink}

هذا الرابط صالح لمدة 24 ساعة من وقت الإرسال.
This link is valid for 24 hours from the time of sending.

إذا لم تقم بطلب هذا البريد الإلكتروني، فيمكنك تجاهله بأمان. لن يتم إنشاء أي حساب.
If you didn't request this email, you can safely ignore it. No account will be created.

مع أطيب التحيات،
فريق المتجر الإلكتروني

Best regards,
E-commerce Store Team
        `;
    }

    static getActivationEmailHTML(name, activationLink) {
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>تفعيل الحساب</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; color: white;">🎉</div>
                        <h1 style="color: #4CAF50; margin: 0;">مرحباً ${name}!</h1>
                        <h2 style="color: #333; margin: 10px 0 0 0;">Welcome ${name}!</h2>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #4CAF50;">
                        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                            شكراً لتسجيلك في لوحة تحكم E-Commerce. حسابك جاهز تقريباً! يرجى النقر على الزر أدناه لتفعيل حسابك والبدء:
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                            Thank you for registering with E-Commerce dashboard. Your account is almost ready! Please click the button below to activate your account and get started:
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${activationLink}" 
                        role="button"
                        aria-label="تفعيل الحساب"
                        style="display: inline-block; 
                                padding: 18px 40px; 
                                background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); 
                                color: white; 
                                text-decoration: none; 
                                border-radius: 30px;
                                font-weight: bold;
                                font-size: 16px;
                                box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);">
                            🚀 تفعيل الحساب / Activate Account
                        </a>
                    </div>
                    
                    <div style="background: #fff3cd; border: 2px solid #ffeaa7; padding: 20px; border-radius: 10px; margin: 25px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #856404;">الرابط البديل / Alternative Link</h4>
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #856404;">
                            أو قم بنسخ الرابط التالي ولصقه في المتصفح:
                        </p>
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #856404;">
                            Or copy and paste the following link in your browser:
                        </p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <p style="word-break: break-all; color: #0066cc; font-size: 13px; margin: 0; font-family: monospace;">${activationLink}</p>
                        </div>
                    </div>
                    
                    <hr style="border: none; border-top: 2px solid #eee; margin: 40px 0;">
                    
                    <div style="text-align: center;">
                        <p style="color: #888; font-size: 14px; margin: 0;">
                            إذا لم تقم بطلب إنشاء هذا الحساب، يرجى تجاهل هذه الرسالة أو التواصل معنا.
                        </p>
                        <p style="color: #888; font-size: 14px; margin: 5px 0 0 0;">
                            If you didn't request this account creation, please ignore this message or contact us.
                        </p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #777; font-size: 14px; margin: 0;">
                                مع أطيب التحيات،<br>فريق E-Commerce
                            </p>
                            <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
                                Best regards,<br>E-Commerce Team
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    static getPasswordResetEmailHTML(name, resetLink, expirationHours = 24) {
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>إعادة تعيين كلمة المرور</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; color: white;">🔑</div>
                        <h1 style="color: #2196F3; margin: 0;">مرحباً ${name}</h1>
                        <h2 style="color: #333; margin: 10px 0 0 0;">إعادة تعيين كلمة المرور</h2>
                        <p style="color: #666; font-size: 16px; margin: 5px 0 0 0;">Password Reset Request</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #2196F3;">
                        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                            تلقينا طلباً لإعادة تعيين كلمة مرور حسابك. إذا كان هذا الطلب منك، انقر على الزر أدناه لإنشاء كلمة مرور جديدة:
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                            We received a request to reset your account password. If this request was from you, click the button below to create a new password:
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetLink}" 
                        role="button"
                        aria-label="إعادة تعيين كلمة المرور"
                        style="display: inline-block; 
                                padding: 18px 40px; 
                                background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); 
                                color: white; 
                                text-decoration: none; 
                                border-radius: 30px;
                                font-weight: bold;
                                font-size: 16px;
                                box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);">
                            🔐 إعادة تعيين كلمة المرور / Reset Password
                        </a>
                    </div>
                    
                    <div style="background: #ffebee; border: 2px solid #ffcdd2; padding: 20px; border-radius: 10px; margin: 25px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #c62828;">⚠️ تحذير هام / Important Warning</h4>
                        <p style="margin: 0; font-size: 14px; color: #c62828; font-weight: bold; line-height: 1.5;">
                            هذا الرابط صالح لمدة ${expirationHours} ساعة فقط من وقت الإرسال.
                        </p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #c62828; font-weight: bold;">
                            This link is valid for only ${expirationHours} hours from the time of sending.
                        </p>
                    </div>
                    
                    <div style="background: #fff3cd; border: 2px solid #ffeaa7; padding: 20px; border-radius: 10px; margin: 25px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #856404;">الرابط البديل / Alternative Link</h4>
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #856404;">
                            أو قم بنسخ الرابط التالي ولصقه في المتصفح:
                        </p>
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #856404;">
                            Or copy and paste the following link in your browser:
                        </p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                            <p style="word-break: break-all; color: #0066cc; font-size: 13px; margin: 0; font-family: monospace;">${resetLink}</p>
                        </div>
                    </div>
                    
                    <!-- Security tips -->
                    <div style="background: #e8f4f8; border: 2px solid #bee5eb; padding: 20px; border-radius: 10px; margin: 25px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #0c5460;">🔒 نصائح أمنية / Security Tips</h4>
                        <ul style="margin: 0; padding-right: 20px; color: #0c5460; font-size: 13px; line-height: 1.5;">
                            <li>استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز</li>
                            <li>لا تشارك كلمة مرورك مع أي شخص</li>
                            <li>Use a strong password with letters, numbers, and symbols</li>
                            <li>Never share your password with anyone</li>
                        </ul>
                    </div>
                    
                    <hr style="border: none; border-top: 2px solid #eee; margin: 40px 0;">
                    
                    <div style="text-align: center;">
                        <p style="color: #888; font-size: 14px; margin: 0;">
                            إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة أو التواصل معنا فوراً.
                        </p>
                        <p style="color: #888; font-size: 14px; margin: 5px 0 0 0;">
                            If you didn't request a password reset, please ignore this message or contact us immediately.
                        </p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #777; font-size: 14px; margin: 0;">
                                مع أطيب التحيات،<br>فريق E-Commerce
                            </p>
                            <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
                                Best regards,<br>E-Commerce Team
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    static getVerificationSuccessHTML(email, frontendUrl = null) {
        const storeUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
        
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>تم التحقق من البريد الإلكتروني بنجاح</title>
                <style>
                    .success-animation {
                        animation: bounce 1s ease-in-out;
                    }
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                        40% { transform: translateY(-20px); }
                        60% { transform: translateY(-10px); }
                    }
                </style>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
                <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center; margin-top: 50px;">
                    <div class="success-animation" style="margin-bottom: 30px;">
                        <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 60px; color: white; box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);">✅</div>
                        <h1 style="color: #4CAF50; margin: 0 0 10px 0; font-size: 32px;">تم بنجاح!</h1>
                        <h2 style="color: #333; margin: 0 0 10px 0; font-size: 24px;">Success!</h2>
                        <p style="color: #666; font-size: 18px; margin: 0;">تم التحقق من بريدك الإلكتروني</p>
                        <p style="color: #666; font-size: 16px; margin: 5px 0 0 0;">Your email has been verified</p>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; border-radius: 15px; margin: 30px 0; border: 2px solid #e9ecef;">
                        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">📧 البريد المؤكد / Confirmed Email</h3>
                        <div style="background: white; padding: 15px; border-radius: 10px; border: 2px solid #4CAF50;">
                            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #2E7D32; word-break: break-all;">
                                ${email}
                            </p>
                        </div>
                        <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
                            يمكنك الآن استخدام هذا البريد لتسجيل الدخول
                        </p>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
                            You can now use this email to log in
                        </p>
                    </div>
                    
                    <div style="margin: 40px 0;">
                        <a href="${storeUrl}" 
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                color: white; 
                                padding: 20px 50px; 
                                text-decoration: none; 
                                border-radius: 35px; 
                                font-weight: bold; 
                                display: inline-block;
                                font-size: 18px;
                                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                                transition: all 0.3s ease;">
                            🛍️ الذهاب إلى المتجر / Go to Store
                        </a>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 25px; border-radius: 15px; margin: 30px 0; border-left: 5px solid #4CAF50;">
                        <h3 style="margin: 0 0 15px 0; color: #2E7D32; font-size: 18px;">🎉 ما القادم؟ / What's Next?</h3>
                        <div style="text-align: right; color: #2E7D32; font-size: 14px; line-height: 1.8;">
                            <p style="margin: 0 0 10px 0;">✓ قم بتسجيل الدخول إلى حسابك</p>
                            <p style="margin: 0 0 10px 0;">✓ استكشف منتجاتنا المتنوعة</p>
                            <p style="margin: 0 0 10px 0;">✓ احصل على عروض حصرية</p>
                            <p style="margin: 0;">✓ ابدأ تجربة تسوق رائعة</p>
                        </div>
                        <div style="text-align: left; color: #2E7D32; font-size: 14px; line-height: 1.8; margin-top: 15px;">
                            <p style="margin: 0 0 10px 0;">✓ Log in to your account</p>
                            <p style="margin: 0 0 10px 0;">✓ Explore our diverse products</p>
                            <p style="margin: 0 0 10px 0;">✓ Get exclusive offers</p>
                            <p style="margin: 0;">✓ Start an amazing shopping experience</p>
                        </div>
                    </div>
                    
                    <hr style="border: none; border-top: 2px solid #eee; margin: 40px 0;">
                    
                    <div style="text-align: center;">
                        <p style="color: #888; font-size: 16px; margin: 0 0 10px 0; font-weight: 500;">
                            🙏 شكراً لانضمامك إلى عائلتنا
                        </p>
                        <p style="color: #888; font-size: 16px; margin: 0 0 20px 0; font-weight: 500;">
                            Thank you for joining our family
                        </p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                © 2025 E-Commerce Store. جميع الحقوق محفوظة / All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // New template for order confirmation
    static getOrderConfirmationHTML(customerName, orderDetails, orderNumber) {
        const { items, total, shippingAddress, estimatedDelivery } = orderDetails;
        
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>تأكيد الطلب</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; color: white;">📦</div>
                        <h1 style="color: #28a745; margin: 0;">تم تأكيد طلبك!</h1>
                        <h2 style="color: #333; margin: 10px 0 0 0;">Order Confirmed!</h2>
                        <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">رقم الطلب: ${orderNumber}</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0;">
                        <h3 style="color: #333; margin: 0 0 15px 0;">مرحباً ${customerName}،</h3>
                        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                            شكراً لك على طلبك! تم استلام طلبك وهو قيد المعالجة الآن.
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                            Thank you for your order! We have received your order and it is now being processed.
                        </p>
                    </div>
                    
                    <!-- Order Items -->
                    <div style="margin: 25px 0;">
                        <h3 style="color: #333; margin: 0 0 15px 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">🛍️ تفاصيل الطلب / Order Details</h3>
                        ${items.map(item => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
                                <div style="flex: 1;">
                                    <h4 style="margin: 0 0 5px 0; color: #333;">${item.name}</h4>
                                    <p style="margin: 0; color: #666; font-size: 14px;">الكمية: ${item.quantity} | Quantity: ${item.quantity}</p>
                                </div>
                                <div style="font-weight: bold; color: #28a745; font-size: 16px;">
                                    ${item.price} ر.س
                                </div>
                            </div>
                        `).join('')}
                        
                        <div style="text-align: left; margin-top: 20px; padding-top: 20px; border-top: 2px solid #28a745;">
                            <h3 style="margin: 0; color: #28a745; font-size: 24px;">
                                المجموع: ${total} ر.س / Total: ${total} SAR
                            </h3>
                        </div>
                    </div>
                    
                    <!-- Shipping Address -->
                    <div style="background: #e8f4f8; padding: 20px; border-radius: 10px; margin: 25px 0;">
                        <h3 style="color: #0c5460; margin: 0 0 15px 0;">📍 عنوان التوصيل / Shipping Address</h3>
                        <p style="margin: 0; color: #0c5460; line-height: 1.6;">
                            ${shippingAddress}
                        </p>
                        <p style="margin: 10px 0 0 0; color: #0c5460; font-size: 14px;">
                            📅 التوصيل المتوقع: ${estimatedDelivery} | Expected Delivery: ${estimatedDelivery}
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 2px solid #eee; margin: 40px 0;">
                    
                    <div style="text-align: center;">
                        <p style="color: #777; font-size: 14px; margin: 0;">
                            سنرسل لك تحديثات حول حالة طلبك عبر البريد الإلكتروني والرسائل النصية.
                        </p>
                        <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
                            We will send you updates about your order status via email and SMS.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // New template for shipping notification
    static getShippingNotificationHTML(customerName, orderNumber, trackingNumber, carrierName) {
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>تم شحن طلبك</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; color: white;">🚚</div>
                        <h1 style="color: #17a2b8; margin: 0;">تم شحن طلبك!</h1>
                        <h2 style="color: #333; margin: 10px 0 0 0;">Your Order Has Been Shipped!</h2>
                        <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">رقم الطلب: ${orderNumber}</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0;">
                        <h3 style="color: #333; margin: 0 0 15px 0;">مرحباً ${customerName}،</h3>
                        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                            أخبار رائعة! تم شحن طلبك وهو في طريقه إليك.
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                            Great news! Your order has been shipped and is on its way to you.
                        </p>
                    </div>
                    
                    <!-- Tracking Information -->
                    <div style="background: #d1ecf1; border: 2px solid #bee5eb; padding: 25px; border-radius: 10px; margin: 25px 0;">
                        <h3 style="color: #0c5460; margin: 0 0 20px 0;">📦 معلومات التتبع / Tracking Information</h3>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span style="color: #666; font-size: 14px;">شركة الشحن / Carrier:</span>
                                <span style="color: #333; font-weight: bold;">${carrierName}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #666; font-size: 14px;">رقم التتبع / Tracking Number:</span>
                                <span style="color: #17a2b8; font-weight: bold; font-family: monospace;">${trackingNumber}</span>
                            </div>
                        </div>
                        
                        <p style="margin: 0; color: #0c5460; font-size: 14px; text-align: center;">
                            يمكنك تتبع طلبك باستخدام رقم التتبع أعلاه
                        </p>
                        <p style="margin: 5px 0 0 0; color: #0c5460; font-size: 14px; text-align: center;">
                            You can track your order using the tracking number above
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 2px solid #eee; margin: 40px 0;">
                    
                    <div style="text-align: center;">
                        <p style="color: #777; font-size: 14px; margin: 0;">
                            سنرسل لك إشعاراً آخر عند وصول طلبك.
                        </p>
                        <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
                            We'll send you another notification when your order arrives.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // New template for delivery confirmation
    static getDeliveryConfirmationHTML(customerName, orderNumber, deliveryDate) {
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>تم توصيل طلبك</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); min-height: 100vh;">
                <div style="background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-top: 50px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 50px; color: white; animation: pulse 2s infinite;">🎉</div>
                        <h1 style="color: #28a745; margin: 0; font-size: 28px;">تم التوصيل بنجاح!</h1>
                        <h2 style="color: #333; margin: 10px 0 0 0; font-size: 22px;">Successfully Delivered!</h2>
                        <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">رقم الطلب: ${orderNumber}</p>
                    </div>
                    
                    <div style="background: #d4edda; border: 2px solid #c3e6cb; padding: 25px; border-radius: 15px; margin: 25px 0; text-align: center;">
                        <h3 style="color: #155724; margin: 0 0 15px 0;">📅 تاريخ التوصيل / Delivery Date</h3>
                        <p style="color: #155724; font-size: 20px; font-weight: bold; margin: 0;">
                            ${deliveryDate}
                        </p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0;">
                        <h3 style="color: #333; margin: 0 0 15px 0;">مرحباً ${customerName}،</h3>
                        <p style="margin: 0; font-size: 16px; line-height: 1.6;">
                            تم توصيل طلبك بنجاح! نتمنى أن تكون راضياً عن مشترياتك.
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                            Your order has been successfully delivered! We hope you're satisfied with your purchases.
                        </p>
                    </div>
                    
                    <!-- Rating request -->
                    <div style="background: #fff3cd; border: 2px solid #ffeaa7; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center;">
                        <h3 style="color: #856404; margin: 0 0 15px 0;">⭐ قيّم تجربتك / Rate Your Experience</h3>
                        <p style="margin: 0 0 20px 0; color: #856404; font-size: 14px;">
                            رأيك يهمنا! شاركنا تقييمك لتجربة التسوق
                        </p>
                        <p style="margin: 0 0 20px 0; color: #856404; font-size: 14px;">
                            Your opinion matters to us! Share your shopping experience rating
                        </p>
                        <div style="font-size: 30px; margin: 20px 0;">
                            ⭐⭐⭐⭐⭐
                        </div>
                    </div>
                    
                    <hr style="border: none; border-top: 2px solid #eee; margin: 40px 0;">
                    
                    <div style="text-align: center;">
                        <p style="color: #777; font-size: 16px; margin: 0 0 10px 0;">
                            🛍️ شكراً لتسوقك معنا
                        </p>
                        <p style="color: #777; font-size: 16px; margin: 0;">
                            Thank you for shopping with us
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // New template for promotional emails
    static getPromotionalEmailHTML(customerName, promotion) {
        const { title, description, discountPercent, validUntil, promoCode } = promotion;
        
        return `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);">
                <div style="background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-top: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 50px; color: white;">🎁</div>
                        <h1 style="color: #ff6b6b; margin: 0; font-size: 32px;">${title}</h1>
                        ${customerName ? `<p style="color: #333; font-size: 18px; margin: 10px 0 0 0;">مرحباً ${customerName}!</p>` : ''}
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 30px; border-radius: 15px; margin: 25px 0; text-align: center;">
                        <h2 style="margin: 0 0 15px 0; font-size: 48px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                            ${discountPercent}%
                        </h2>
                        <h3 style="margin: 0; font-size: 24px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                            خصم / DISCOUNT
                        </h3>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center;">
                        <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333;">
                            ${description}
                        </p>
                    </div>
                    
                    <!-- Promo Code -->
                    <div style="background: #fff3cd; border: 3px dashed #ffc107; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center;">
                        <h3 style="color: #856404; margin: 0 0 15px 0;">🏷️ كود الخصم / Promo Code</h3>
                        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #ffc107;">
                            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #856404; font-family: monospace; letter-spacing: 3px;">
                                ${promoCode}
                            </p>
                        </div>
                        <p style="margin: 15px 0 0 0; color: #856404; font-size: 12px;">
                            انسخ الكود واستخدمه عند الدفع | Copy and use at checkout
                        </p>
                    </div>
                    
                    <!-- Validity -->
                    <div style="background: #ffebee; border: 2px solid #ffcdd2; padding: 20px; border-radius: 10px; margin: 25px 0; text-align: center;">
                        <h4 style="color: #c62828; margin: 0 0 10px 0;">⏰ العرض ساري حتى / Valid Until</h4>
                        <p style="color: #c62828; font-size: 18px; font-weight: bold; margin: 0;">
                            ${validUntil}
                        </p>
                        <p style="color: #c62828; font-size: 14px; margin: 5px 0 0 0;">
                            لا تفوت الفرصة! | Don't miss out!
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                        style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); 
                                color: white; 
                                padding: 20px 50px; 
                                text-decoration: none; 
                                border-radius: 35px; 
                                font-weight: bold; 
                                display: inline-block;
                                font-size: 18px;
                                box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
                                text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
                            🛒 تسوق الآن / Shop Now
                        </a>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = EmailTemplates;