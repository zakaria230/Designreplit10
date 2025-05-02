# DesignKorv cPanel Deployment Steps (UPDATED SOLUTION)

This guide contains the specific steps to fix the 403 Access Denied error and deploy DesignKorv to your cPanel hosting.

## Before You Begin

1. Make sure your cPanel hosting supports Node.js applications (you seem to have this)
2. You need PostgreSQL database access (check with your hosting provider if unsure)

## Step 1: Prepare Your Local Build (FIXED)

1. Run the build command locally to generate production files:
   ```
   npm run build
   ```

2. Run the cPanel preparation script:
   ```
   node build-for-cpanel.js
   ```
   This will create additional files needed specifically for cPanel deployment.

## Step 2: Upload Files to cPanel (FIXED)

Upload the following files and directories to your cPanel hosting root directory:

### Essential Files
- `dist/` directory (contains compiled server and client code)
- `cjs-adapter.cjs` (critical - this is the entry point for cPanel)
- `.htaccess` (critical - contains rewrite rules to make the app work)
- `index.html` (main HTML entry point for the frontend)

### Additional Required Files
- `node_modules/` directory (dependencies)
- `.env` file (based on the .env.example template) - rename .env.cpanel and update values
- `uploads/` directory (for user uploaded files)

## Step 3: Create and Configure Database

1. In cPanel, go to "PostgreSQL Databases" and create a new database
2. Create a database user with full privileges
3. Update your `.env` file with the database credentials:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database_name
   PGUSER=username
   PGPASSWORD=password
   PGHOST=hostname
   PGPORT=5432
   PGDATABASE=database_name
   ```

## Step 4: Set Up Node.js Application (CRITICAL STEP)

1. In cPanel, look for "Setup Node.js App" or similar option
2. Create a new Node.js application with these settings:
   - Application Mode: Production
   - Node.js Version: Select the latest available (v18+ recommended)
   - Application Root: Your website root directory
   - Application URL: Your domain name
   - **Application Startup File: cjs-adapter.cjs** (VERY IMPORTANT - NOT server.js)
   - Environment Variables: NODE_ENV=production

## Step 5: Initialize the Database

1. Set up SSH access to your cPanel account
2. Connect via SSH and navigate to your website directory
3. Run the database migration command:
   ```
   node_modules/.bin/drizzle-kit push
   ```

## Step 6: Start the Application

1. In the cPanel Node.js App interface, click "Start Application"
2. If there's a "Run JS Script" option, use it to run server.js

## Step 7: Test Your Deployment

1. Visit your domain name in a web browser
2. Check that all pages load correctly
3. Verify database connectivity by trying to register or login
4. Test payment processing with a test transaction

## Common Issues and Fixes

### 403 Forbidden Error
- Check that the `.htaccess` file is uploaded and properly configured
- Verify file permissions: directories should be 755, files should be 644

### Database Connection Errors
- Double-check all database credentials in the `.env` file
- Ensure your database user has the correct permissions
- Some hosts require specific IP allowlisting for database connections

### Application Won't Start
- Check Node.js application logs in cPanel for error messages
- Verify that `server.js` is in the correct directory
- Make sure all required environment variables are set

### Static Assets Not Loading
- Ensure the client/public directory is uploaded correctly
- Check that your frontend uses correct relative paths for assets

### Payment Gateway Issues
- Verify your Stripe/PayPal API keys in the `.env` file
- Ensure the keys are in the correct format and not expired
- Check that your payment processor accounts are properly configured

## Getting Additional Help

If you continue experiencing issues, consider:
1. Contacting your hosting provider's support
2. Checking cPanel error logs for specific error messages
3. Deploying to a Node.js specialized hosting platform like Heroku, Render, or Vercel