# الحل النهائي والشامل لنشر تطبيق DesignKorv على cPanel

## ما قبل البدء
1. سنستخدم طريقة "التشغيل الثابت" (static serving) للواجهة الأمامية وتجاهل الواجهة الخلفية مؤقتاً.
2. لن نستخدم ملفات TypeScript أو ES Modules أو أي تعقيدات أخرى.
3. سنصنع أبسط ملف خادم ممكن.

## الملفات التي سنستخدمها فقط

### 1. ملف الخادم البسيط (index.js)

```javascript
// ملف خادم بسيط لـ cPanel
const express = require('express');
const path = require('path');
const fs = require('fs');

// إنشاء تطبيق Express
const app = express();

// تحديد المسار للملفات الثابتة
const staticPath = path.join(__dirname, 'static');

// خدمة الملفات الثابتة
app.use(express.static(staticPath));

// خدمة مجلد التحميلات
if (fs.existsSync(path.join(__dirname, 'uploads'))) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// نقطة تشخيصية بسيطة
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// توجيه كل المسارات غير المعروفة إلى index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API not found' });
  }
  
  const indexPath = path.join(staticPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <html>
        <head><title>DesignKorv</title></head>
        <body>
          <h1>DesignKorv is working!</h1>
          <p>The server is running, but no index.html was found in the static directory.</p>
          <p>Current directory: ${__dirname}</p>
          <p>Static directory: ${staticPath}</p>
          <p>Files in static directory: ${fs.existsSync(staticPath) ? fs.readdirSync(staticPath).join(', ') : 'Directory not found'}</p>
        </body>
      </html>
    `);
  }
});

// تصدير التطبيق للاستخدام مع Passenger
module.exports = app;

// إذا تم تشغيل الملف مباشرة
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

### 2. ملف package.json البسيط

```json
{
  "name": "designkorv",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

### 3. ملف .htaccess

```
# Enable rewrite engine
RewriteEngine On

# If a file or directory doesn't exist
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Exclude /uploads from the rewrite rules
RewriteCond %{REQUEST_URI} !^/uploads/

# Rewrite all requests to the Node.js application
RewriteRule ^(.*)$ app.js/$1 [L,QSA]
```

## خطوات النشر المبسطة للغاية

### 1. تجهيز الملفات

1. أنشئ مجلد جديد اسمه `designkorv-cpanel`
2. أنشئ ملف `index.js` بمحتوى ملف الخادم البسيط
3. أنشئ ملف `package.json` بمحتوى ملف package.json البسيط
4. أنشئ ملف `.htaccess` بمحتوى ملف .htaccess
5. أنشئ مجلد `static` وضع فيه ملف `index.html` بسيط للاختبار:

```html
<!DOCTYPE html>
<html>
<head>
  <title>DesignKorv Test</title>
</head>
<body>
  <h1>DesignKorv is Working!</h1>
  <p>If you see this, the basic setup is working correctly.</p>
</body>
</html>
```

6. انسخ مجلد `uploads` إلى المجلد الجديد (اختياري)

### 2. تثبيت الاعتمادات

قم بتشغيل هذا الأمر في مجلد `designkorv-cpanel`:

```bash
npm install
```

### 3. اختبار المشروع محلياً

```bash
node index.js
```

زر http://localhost:3000 للتأكد من أن كل شيء يعمل.

### 4. رفع الملفات إلى cPanel

1. ارفع كل محتويات مجلد `designkorv-cpanel` إلى المجلد الرئيسي لموقعك في cPanel
2. **هام**: لا ترفع مجلد `node_modules` - سنقوم بتثبيت الاعتمادات على الخادم مباشرة

### 5. إعداد تطبيق Node.js في cPanel

1. اذهب إلى **Setup Node.js App** في لوحة تحكم cPanel
2. أنشئ تطبيقاً جديداً (أو عدل التطبيق الحالي) بالإعدادات التالية:
   - **Node.js version**: 18.x
   - **Application mode**: Production
   - **Application root**: المسار الكامل لمجلد موقعك (مثل `/home/b5a4fc5/Desivoo`)
   - **Application URL**: اسم النطاق أو النطاق الفرعي المطلوب
   - **Application startup file**: `index.js`
   - **Passenger log file**: `/home/b5a4fc5/logs/passenger.log`

### 6. تثبيت الاعتمادات على الخادم

قم بالاتصال بالخادم عبر SSH أو Terminal في cPanel، ثم نفذ:

```bash
cd ~/public_html  # أو المسار حيث رفعت الملفات
npm install express
```

### 7. إعادة تشغيل التطبيق

انقر على زر **Restart** في إعدادات تطبيق Node.js في cPanel.

### 8. اختبار التطبيق

زر موقعك للتأكد من أن التطبيق يعمل. إذا كان يعمل، زر `/api/health` للتأكد من أن الخادم يستجيب بشكل صحيح.

## بعد نجاح التشغيل الأساسي

بعد التأكد من أن الإعداد الأساسي يعمل، يمكنك:

1. استبدال محتويات مجلد `static` بملفات الواجهة الأمامية المُجمعة (مجلد `dist/client`)
2. تعديل ملف `index.js` تدريجياً لإضافة المزيد من وظائف الواجهة الخلفية

## استكشاف الأخطاء وإصلاحها

### إذا استمرت المشكلة:

1. **تحقق من سجلات الأخطاء**:
   ```bash
   cat ~/logs/passenger.log
   ```

2. **تأكد من تثبيت Express**:
   ```bash
   cd ~/public_html
   npm list express
   ```

3. **تأكد من صلاحيات الملفات**:
   ```bash
   chmod 755 index.js
   chmod -R 755 static
   ```

4. **حاول تشغيل الخادم يدوياً**:
   ```bash
   cd ~/public_html
   node index.js
   ```

5. **تحقق من ضبط البيئة**:
   أنشئ ملف `.env` في مجلد التطبيق:
   ```
   NODE_ENV=production
   PORT=3000
   ```

6. **تحقق من عدم وجود ملفات تالفة**:
   - تأكد من أن ملف `package.json` لا يحتوي على `"type": "module"`
   - تأكد من عدم وجود أخطاء إملائية في الملفات

إذا واجهت أي مشاكل محددة، دون رسائل الخطأ من السجلات وأخبرني بها.