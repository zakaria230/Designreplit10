# Critical Fix for 403 Access Denied Error on cPanel

## Your Current Issue

Based on your screenshots, you're experiencing a **403 Access Denied** error when trying to access your DesignKorv website on cPanel hosting. This is a common issue when deploying Node.js applications on shared hosting environments like cPanel.

## Root Causes & Solutions

### 1. Missing Entry Point

**Problem:** cPanel needs a specific entry point file to run Node.js applications.

**Solution:** 
- We've created `cjs-adapter.cjs` - this file serves as a bridge between the CommonJS format that cPanel expects and your ESM-based application.
- Use this file as your application startup file in cPanel's Node.js configuration.

### 2. Incorrect Apache Configuration

**Problem:** The default Apache configuration isn't properly routing requests to your Node.js application.

**Solution:**
- We've completely rewritten `.htaccess` with proper rewrite rules to handle both API and frontend routes.
- This file needs to be in your root directory with the correct permissions (644).

### 3. Application Structure Mismatch

**Problem:** The standard build process doesn't match cPanel's expected file structure.

**Solution:**
- Use our custom `build-for-cpanel.js` script after running the regular build command.
- This script prepares the necessary files and structure specifically for cPanel deployment.

## Step-by-Step Fix Instructions

1. **Run Build Process**:
   ```
   npm run build
   node build-for-cpanel.js
   ```

2. **Upload Critical Files**:
   - `cjs-adapter.cjs` 
   - `.htaccess`
   - `dist/` directory
   - `node_modules/` directory
   - `.env` file (with your actual DB credentials)

3. **Configure Node.js App in cPanel**:
   - Find "Setup Node.js App" in cPanel
   - Set startup file to `cjs-adapter.cjs` (NOT server.js)
   - Set application mode to Production
   - Set your website root as application root directory

4. **File Permissions**:
   - Set directories to 755 (rwxr-xr-x)
   - Set files to 644 (rw-r--r--)
   - Make sure `.htaccess` has 644 permissions

5. **Restart Application**:
   - In cPanel's Node.js app interface, click "Restart Application"

Full detailed instructions are in the CPANEL_DEPLOYMENT_STEPS.md file we created.

## Additional Debugging Tips

If you're still having issues:

1. Check cPanel error logs
2. Try accessing specific API endpoints directly (e.g., yourdomain.com/api/products)
3. Make sure your database credentials are correct in the .env file
4. Consider temporarily setting NODE_ENV=development for more verbose logging