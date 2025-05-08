# حل مشكلة نشر تطبيق Node.js على cPanel

## المشكلة التي تم حلها
كان التطبيق يواجه مشكلة عند نشره على cPanel بسبب:
1. مشكلة في ملفات TypeScript (.ts) التي لا يمكن تشغيلها مباشرة
2. تعارض بين نظام الوحدات ESM و CommonJS بسبب `"type": "module"` في ملف package.json

## خطوات الحل

### 1. إعدادات cPanel
- **Node.js Version**: 18.20.7
- **Application Mode**: Production
- **Application Root**: مسار مجلد مشروعك (مثل: `/home/b5a4fc5/Desivoo`)
- **Application Startup File**: `cjs-adapter.cjs`
- **Passenger Log File**: `/home/b5a4fc5/logs/passenger.log`

### 2. ملفات جديدة تم إنشاؤها
1. `server.cjs`: نسخة متوافقة مع CommonJS من ملف `server.js`
2. `package.cpanel.json`: ملف package.json معدل لـ cPanel بدون `"type": "module"`

### 3. تغييرات على الملفات
1. تحديث `cjs-adapter.cjs` لاستخدام `server.cjs` بدلاً من ملفات TypeScript

### 4. خطوات النشر
1. انسخ الملفات التالية إلى خادم cPanel:
   - مجلد `dist/`
   - مجلد `node_modules/`
   - مجلد `uploads/`
   - ملف `.htaccess`
   - ملف `cjs-adapter.cjs` (المعدل)
   - ملف `server.cjs` (الجديد)
   - انسخ محتوى `package.cpanel.json` إلى `package.json` على الخادم

2. تأكد من تغيير اسم `package.cpanel.json` إلى `package.json` في مجلد المشروع على الخادم

3. قم بإنشاء ملف `.env` في مجلد المشروع بالمتغيرات المناسبة:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=...
   # باقي المتغيرات
   ```

4. في cPanel، انقر على "إعادة تشغيل" لتطبيق التعديلات

## ملاحظات
- لا تستخدم `server.js` لأنه يعتبر وحدة ESM بسبب `"type": "module"` في ملف package.json الأصلي
- `server.cjs` و `cjs-adapter.cjs` يستخدمان نظام CommonJS المتوافق مع cPanel
- تأكد من أن مجلد `dist/client` يحتوي على ملفات الواجهة الأمامية المُجمعة