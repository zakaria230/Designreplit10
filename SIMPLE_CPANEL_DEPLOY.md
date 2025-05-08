# خطوات نشر مبسطة للتجربة على cPanel

## المشكلة
تواجه صعوبة في نشر التطبيق على cPanel بسبب مشاكل في تحميل الوحدات (ESM vs CommonJS). هذه خطوات مبسطة لنشر نسخة بسيطة للتحقق من صحة الإعدادات.

## الملفات الجديدة
- `server.minimal.cjs`: خادم Express مبسط للغاية
- تحديث `cjs-adapter.cjs` لاستخدام الخادم المبسط

## خطوات النشر المبسطة

### 1. الملفات المطلوبة فقط
ارفع هذه الملفات فقط إلى مجلد موقعك على cPanel:

- مجلد `dist/` (إذا كان موجوداً)
- ملف `server.minimal.cjs` (الجديد)
- ملف `cjs-adapter.cjs` (المعدل)
- ملف `passenger-nodejs.json`

### 2. إعدادات cPanel
قم بضبط الإعدادات التالية في لوحة تحكم cPanel:

- **Node.js version**: 18.x
- **Application mode**: Production
- **Application root**: مسار مجلد موقعك
- **Application startup file**: `cjs-adapter.cjs`

### 3. اختبار التشغيل
بعد النشر، زر الروابط التالية:
- `https://your-domain.com/api/health`
- `https://your-domain.com/diagnose`

إذا عملت هذه المسارات، فهذا يعني أن الإعداد الأساسي يعمل بشكل صحيح.

## إذا نجحت العملية
بعد نجاح تشغيل النسخة المبسطة، يمكنك الانتقال إلى نشر النسخة الكاملة باتباع الخطوات في `CPANEL_DEPLOYMENT_STEPS.md`.