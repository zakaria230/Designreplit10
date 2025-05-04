# إصلاح مشكلة بناء DesignKorv على Netlify

هذه الوثيقة تشرح كيفية إصلاح مشكلة البناء التي تواجهها عند نشر التطبيق على Netlify.

## المشكلة

عند محاولة بناء التطبيق على Netlify، تظهر رسالة خطأ:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vitejs/plugin-react' imported from /opt/build/repo/vite.config.ts
```

هذا يعني أن Netlify لا يستطيع العثور على حزمة `@vitejs/plugin-react` المطلوبة لبناء التطبيق.

## الحلول

قمنا بإجراء عدة تغييرات لحل هذه المشكلة:

### 1. تعديل ملف netlify.toml

قمنا بتعديل ملف `netlify.toml` ليشمل الأوامر اللازمة لتثبيت الحزم المطلوبة قبل البناء:

```toml
[build]
  publish = "dist/client"
  command = "npm install && npm install @vitejs/plugin-react vite esbuild && npm run build && node build-for-netlify.js"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

### 2. إضافة ملف package-netlify.json

أضفنا ملف `package-netlify.json` يحدد الحزم المطلوبة لعملية البناء:

```json
{
  "name": "designkorv-netlify-deploy",
  "version": "1.0.0",
  "description": "Deployment package for DesignKorv on Netlify",
  "dependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "esbuild": "^0.19.0",
    "serverless-http": "^3.2.0",
    "netlify-lambda": "^2.0.16",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "passport": "^0.6.0",
    "@neondatabase/serverless": "^0.6.0"
  }
}
```

### 3. تحسين سكريبت build-for-netlify.js

قمنا بتحسين سكريبت `build-for-netlify.js` ليعمل بشكل أفضل في بيئة Netlify:

- إضافة معلومات تشخيصية للمساعدة في تحديد المشكلات
- تحسين عملية إنشاء الملفات المطلوبة
- ضمان وجود ملف index.html في المكان الصحيح

### 4. إنشاء هيكل المجلدات والملفات اللازمة

قمنا بإنشاء:

- مجلد `dist/client` مع ملف `index.html`
- ملف `_redirects` في مجلد `dist/client`
- مجلد `netlify/functions` مع ملف `api.js` المحدّث

## خطوات إضافية للتنفيذ

بعد تطبيق هذه التغييرات، يجب عليك:

1. رفع هذه التغييرات إلى مستودع Git الخاص بك:
   ```bash
   git add .
   git commit -m "إصلاح مشكلة بناء Netlify"
   git push
   ```

2. في لوحة تحكم Netlify، تأكد من تكوين المتغيرات البيئية:
   - `DATABASE_URL` - رابط قاعدة البيانات
   - `SESSION_SECRET` - كلمة سر لتشفير جلسات المستخدمين
   - `STRIPE_SECRET_KEY` - مفتاح Stripe السري
   - `VITE_STRIPE_PUBLIC_KEY` - مفتاح Stripe العام
   - `PAYPAL_CLIENT_ID` - معرف PayPal
   - `PAYPAL_CLIENT_SECRET` - كلمة سر PayPal

3. إعادة تشغيل عملية البناء في Netlify.

## ملاحظات إضافية

- تأكد من أن ملف `vite.config.ts` موجود ومكوّن بشكل صحيح
- إذا استمرت المشكلة، يمكن تجربة تبسيط عملية البناء بشكل مؤقت إلى `npm run build` فقط
- تحقق من سجلات البناء في Netlify لتحديد أي مشاكل أخرى