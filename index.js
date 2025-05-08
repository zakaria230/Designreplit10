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