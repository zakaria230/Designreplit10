# دليل نشر DesignKorv على Netlify (محدّث)

هذا الدليل الشامل يساعدك على نشر منصة DesignKorv للتجارة الإلكترونية على Netlify بدون أي مشاكل. نحن نستخدم نهجًا محسنًا يتم فيه نشر **واجهة المستخدم والخادم معًا على Netlify** باستخدام Netlify Functions بأفضل الممارسات.

> **هام**: قبل النشر، نوصي بمسح بيانات الاختبار من قاعدة البيانات للبدء من جديد. استخدم السكريبت المقدم:
> ```bash
> # اجعل السكريبت قابل للتنفيذ
> chmod +x clear-db.sh
> # قم بتشغيل السكريبت
> ./clear-db.sh
> ```
> هذا سيحتفظ بحساب المسؤول وإعدادات الموقع ولكنه سيمسح جميع المنتجات والطلبات وبيانات الاختبار الأخرى.

## تحديثات وإصلاحات جديدة في هذا الإصدار (v1.2)

- ✅ تحسين ملف `netlify.toml` لمعالجة مشاكل التبعيات
- ✅ تحويل سكريبت البناء إلى تنسيق CommonJS لتجنب مشاكل ES Modules
- ✅ إضافة ملفات _redirects بشكل صحيح
- ✅ إعداد وظيفة API بشكل أفضل باستخدام serverless-http
- ✅ تحسين إعدادات الجلسات لتعمل في بيئة Netlify
- ✅ إضافة وظيفة إعداد قاعدة البيانات
- ✅ تعليمات محسنة لاستكشاف الأخطاء وإصلاحها

## Prerequisites

1. A Netlify account (sign up at [netlify.com](https://netlify.com))
2. Git repository for your project
3. A PostgreSQL database (we recommend [Neon](https://neon.tech) for its Netlify integration)
4. Your Stripe and PayPal API keys ready

## Setup Steps (Unified Approach)

This approach keeps your entire application - both frontend and backend - on Netlify, avoiding CORS issues, cross-domain cookies problems, and configuration complexity.

### 1. Set Up Your Database

1. Create a PostgreSQL database with [Neon](https://neon.tech) (recommended for Netlify integration):
   - Sign up for a Neon account
   - Create a new project
   - Create a database named `designkorv`
   - Copy your database connection string

2. If you prefer other providers, you can use:
   - [Supabase](https://supabase.com)
   - [Railway](https://railway.app)
   - Any other PostgreSQL provider

### 2. قم بتشغيل سكريبت البناء المحسّن لـ Netlify

هذا السكريبت يقوم بإعداد كل ما هو مطلوب لنشر التطبيق على Netlify:

```bash
# أولاً قم ببناء التطبيق
npm run build

# ثم قم بتشغيل سكريبت الإعداد المتخصص لـ Netlify
node build-for-netlify.cjs
```

This will:
- Create the necessary Netlify configuration files
- Set up Netlify Functions to host your backend API
- Configure proper redirects for your application
- Ensure your index.html is in the correct location
- Verify all required files are present

### 3. Push Your Changes to GitHub

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push
```

### 4. Connect Your Repository to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect to your GitHub account and select your repository
4. Use these build settings:
   - Build command: `npm run build && node build-for-netlify.cjs`
   - Publish directory: `dist/client`
   - Functions directory: `netlify/functions`

### 5. Configure Environment Variables

In the Netlify UI, go to Site settings > Environment variables and add:

```
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database_name
PGUSER=username
PGPASSWORD=password
PGHOST=hostname
PGPORT=5432
PGDATABASE=database_name

# Security
SESSION_SECRET=generate_a_secure_random_string_here

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Environment settings
NODE_ENV=production
```

### 6. Deploy Your Site

1. In the Netlify dashboard, click "Deploy site"
2. Wait for the build to complete
3. Once deployed, Netlify will provide you with a URL (e.g., `https://designkorv.netlify.app`)

### 7. Set Up Your Custom Domain (Optional)

1. In the Netlify UI, go to Site settings > Domain management
2. Click "Add custom domain"
3. Follow the instructions to configure your DNS settings

### 8. Initialize Your Database

After deployment, you need to initialize your database schema:

1. In the Netlify UI, go to Site settings > Functions > Console
2. Run the following commands:
   ```bash
   cd netlify/functions
   npx drizzle-kit push
   ```

Or alternatively, temporarily add a setup function:

1. Create a file `netlify/functions/setup-db.js`:
   ```javascript
   const { db } = require('../../server/db');
   const { exec } = require('child_process');
   
   exports.handler = async function() {
     try {
       // Run drizzle-kit push
       await new Promise((resolve, reject) => {
         exec('npx drizzle-kit push', (error, stdout) => {
           if (error) reject(error);
           else resolve(stdout);
         });
       });
       
       return {
         statusCode: 200,
         body: JSON.stringify({ message: 'Database initialized successfully' })
       };
     } catch (error) {
       return {
         statusCode: 500,
         body: JSON.stringify({ error: error.message })
       };
     }
   };
   ```

2. Visit `https://your-netlify-url/.netlify/functions/setup-db` once to run the initialization
3. Remove the function after it's done

## Troubleshooting (Common Issues)

### 1. Missing index.html

If you see a "Page Not Found" error:

**Solution**: Ensure your `index.html` is correctly placed in the `dist/client` directory.
```bash
# Run this to verify
ls -la dist/client

# If missing, copy it manually
cp client/index.html dist/client/
```

### 2. API Requests Return 404

If your API requests are failing:

**Solution**: Verify your Netlify Function is correctly set up:
1. Check `netlify/functions/api.js` exists
2. Ensure your `_redirects` file has the correct API route mapping
3. Test the function directly: `https://your-site.netlify.app/.netlify/functions/api/user`

### 3. Database Connection Errors

If you see database connection errors:

**Solution**:
1. Verify your environment variables are correctly set in Netlify
2. Ensure your database allows connections from Netlify IPs
3. Check that your database is online and accessible
4. Test your connection string locally before deploying

### 4. Build Failures

If your Netlify build is failing:

**Solution**:
1. Check the build logs in your Netlify dashboard
2. Ensure all dependencies are properly listed in `package.json`
3. Temporarily simplify the build command to `npm run build` to isolate issues
4. Increase build memory: Go to Site settings > Build & deploy > Edit settings > Build memory

### 5. Authentication Problems

If login/session management isn't working:

**Solution**:
1. Check that `SESSION_SECRET` is properly set
2. Verify that cookies are being set correctly
3. Ensure the database contains your user records
4. Try clearing your browser cookies and cache

### 6. Payment Gateway Issues

If payments aren't processing:

**Solution**:
1. Verify all Stripe/PayPal keys are correctly set in environment variables
2. Ensure keys are for the correct environment (test/production)
3. Check that payment webhooks are properly configured
4. Test with Stripe's testing cards/PayPal sandbox accounts

## Deployment Checklist

Before finalizing your deployment, verify these items:

- [ ] All environment variables are set in Netlify dashboard
- [ ] Database is properly configured and accessible
- [ ] Netlify Functions are correctly set up
- [ ] Frontend routes work properly
- [ ] API endpoints are accessible
- [ ] Authentication flow works
- [ ] Payments process correctly
- [ ] Admin dashboard is functional
- [ ] File uploads work as expected

## Additional Resources

- [Netlify Docs: Functions](https://docs.netlify.com/functions/overview/)
- [Netlify Docs: Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [PostgreSQL with Netlify](https://www.netlify.com/blog/2022/07/28/deploy-a-full-stack-app-with-netlify-functions-and-postgresql/)
- [Neon Database Documentation](https://neon.tech/docs)
- [Troubleshooting Netlify Deployments](https://docs.netlify.com/configure-builds/troubleshooting-tips/)

## Conclusion

By following this guide, you've deployed DesignKorv to Netlify with both frontend and backend together, avoiding cross-domain issues and simplifying your infrastructure. This approach offers several advantages:

- Simplified deployment process
- Unified hosting environment
- Automatic scaling with Netlify
- Easy environment variable management
- Integrated CI/CD pipeline
- Ability to use Netlify's edge functions and CDN

Your e-commerce platform is now ready to use, with a secure, scalable infrastructure that can handle your business needs.