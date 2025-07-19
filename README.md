# E-commerce Backend with SuperTokens Authentication

## المميزات

- ✅ تسجيل الدخول والخروج باستخدام SuperTokens
- ✅ تسجيل حسابات جديدة مع التحقق من البريد الإلكتروني
- ✅ تسجيل الدخول عبر Google و Facebook
- ✅ إدارة الملف الشخصي والعناوين
- ✅ تغيير كلمة المرور
- ✅ إدارة الجلسات النشطة
- ✅ رفع الصور الشخصية
- ✅ إعدادات المستخدم والتفضيلات

## التثبيت

1. استنساخ المشروع:
```bash
git clone <repository-url>
cd ecommerce-backend
```

2. تثبيت المكتبات:
```bash
npm install
```

3. إعداد متغيرات البيئة:
```bash
cp .env.example .env
# قم بتعديل ملف .env بالقيم الصحيحة
```

4. تشغيل قاعدة البيانات:
```bash
# MongoDB
mongod

# Redis
redis-server
```

5. تشغيل التطبيق:
```bash
npm run dev
```

## API Endpoints

### المصادقة
- `POST /auth/signup` - إنشاء حساب جديد
- `POST /auth/signin` - تسجيل الدخول
- `POST /auth/signout` - تسجيل الخروج
- `POST /auth/user/password/reset` - إعادة تعيين كلمة المرور
- `POST /auth/user/email/verify` - التحقق من البريد الإلكتروني

### المستخدم
- `GET /auth/user/me` - الحصول على بيانات المستخدم الحالي
- `PUT /auth/user/profile` - تحديث الملف الشخصي
- `PUT /auth/user/password` - تغيير كلمة المرور
- `DELETE /auth/user/account` - حذف الحساب

### العناوين
- `POST /auth/user/addresses` - إضافة عنوان جديد
- `PUT /auth/user/addresses/:id` - تحديث عنوان
- `DELETE /auth/user/addresses/:id` - حذف عنوان

### الإعدادات
- `PUT /auth/user/preferences` - تحديث الإعدادات
- `POST /auth/user/avatar` - رفع صورة شخصية

### الجلسات
- `GET /auth/user/sessions` - الحصول على الجلسات النشطة
- `DELETE /auth/user/sessions/:handle` - إنهاء جلسة محددة
- `POST /auth/user/logout/all` - تسجيل الخروج من جميع الأجهزة

## الاستخدام

### إنشاء حساب جديد
```javascript
const response = await fetch('/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123',
    firstName: 'Ahmed',
    lastName: 'Mohamed'
  })
});
```

### تسجيل الدخول
```javascript
const response = await fetch('/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'Password123'
  })
});
```

### الحصول على بيانات المستخدم
```javascript
const response = await fetch('/auth/user/me', {
  method: 'GET',
  credentials: 'include'
});
```

## الأمان

- استخدام SuperTokens للمصادقة الآمنة
- تشفير كلمات المرور
- حماية من CSRF
- Rate limiting
- التحقق من البريد الإلكتروني
- إدارة الجلسات

## المساهمة

1. Fork المشروع
2. إنشاء branch جديد
3. إضافة التحسينات
4. إرسال Pull Request

## الرخصة

MIT License