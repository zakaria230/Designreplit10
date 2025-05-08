# خطوات نشر DesignKorv على خدمة cPanel

هذا الدليل يشرح خطوات نشر تطبيق DesignKorv على استضافة cPanel. يرجى اتباع الخطوات بدقة لتجنب المشاكل الشائعة.

## المشكلة الأساسية

cPanel تستخدم Passenger كخادم تطبيقات Node.js، وهو يواجه مشكلة في تحميل ملفات ES Modules (.js مع `"type": "module"`). الحل هو استخدام ملفات CommonJS (.cjs) بدلاً منها.

## قبل البدء

1. تأكد من بناء التطبيق محلياً:
   ```bash
   npm run build
   ```

2. قم بتشغيل سكريبت التحضير للنشر على cPanel:
   ```bash
   node build-for-cpanel.js
   ```

## خطوات النشر

### 1. الملفات المطلوبة للرفع

قم برفع الملفات والمجلدات التالية إلى مجلد موقعك على cPanel:

- مجلد `dist/` (يحتوي على ملفات الواجهة الأمامية والخلفية)
- مجلد `uploads/` (يحتوي على ملفات الصور والمنتجات)
- ملف `server.cjs` (الخادم المتوافق مع CommonJS)
- ملف `cjs-adapter.cjs` (وسيط التوافق مع Passenger)
- ملف `passenger-nodejs.json` (إعدادات Passenger)
- ملف `package.cpanel.json` (يجب إعادة تسميته إلى `package.json` على الخادم)
- ملف `.htaccess` (لتوجيه الطلبات بشكل صحيح)

### 2. بعد رفع الملفات

1. قم بتسمية `package.cpanel.json` إلى `package.json` على الخادم
   ```bash
   mv package.cpanel.json package.json
   ```

2. قم بإنشاء ملف `.env` في المجلد الجذر مع المتغيرات اللازمة:
   ```
   NODE_ENV=production
   DATABASE_URL=your_database_url
   # أضف متغيرات أخرى حسب الحاجة
   ```

### 3. إعداد تطبيق Node.js في cPanel

1. اذهب إلى **Setup Node.js App** في لوحة تحكم cPanel
2. قم بإعداد التطبيق كالتالي:
   - **Node.js version**: 18.x
   - **Application mode**: Production
   - **Application root**: مسار مجلد موقعك (مثل `/home/b5a4fc5/Desivoo`)
   - **Application URL**: اسم النطاق أو النطاق الفرعي المطلوب
   - **Application startup file**: `cjs-adapter.cjs`

### 4. التحقق من الإعدادات

1. افتح مسار الموقع `/diagnose` للتحقق من حالة التطبيق ومسارات الملفات
2. إذا واجهت مشاكل، تحقق من ملفات السجل (logs):
   - `/home/b5a4fc5/logs/passenger.log`
   - `/home/b5a4fc5/logs/error_log`

## التصحيح وحل المشاكل

### مشكلة: ملفات ESM/CommonJS

إذا ظهرت رسالة خطأ `Error [ERR_REQUIRE_ESM]`، فهذا يعني أن Passenger يحاول استخدام `require()` مع ملف ES Module. الحل:

1. تأكد من استخدام `cjs-adapter.cjs` كملف بدء التشغيل
2. تأكد من أن ملف package.json على الخادم لا يحتوي على `"type": "module"`
3. تأكد من أن `server.cjs` موجود ويستخدم بنية CommonJS

### مشكلة: ملفات الواجهة الأمامية غير موجودة

إذا ظهرت صفحة "Application Files Not Found"، فهذا يعني أن الخادم لا يستطيع العثور على ملفات الواجهة الأمامية. الحل:

1. تأكد من أن مجلد `dist/client` موجود ويحتوي على index.html
2. تحقق من الصلاحيات: `chmod -R 755 dist/`

## إضافي: تثبيت حزم Node.js على cPanel

إذا كنت بحاجة إلى تثبيت حزم إضافية على الخادم:

```bash
cd ~/Desivoo  # اسم مجلد موقعك
npm install package-name
```

## لمزيد من المساعدة

إذا واجهت مشاكل إضافية، قم بتشغيل `/diagnose` في موقعك للحصول على معلومات تشخيصية، وراجع ملف `/home/b5a4fc5/logs/passenger.log` للحصول على رسائل الخطأ.