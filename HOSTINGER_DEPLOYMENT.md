# Deploying DesignKorv to Hostinger

This guide outlines the steps to deploy the DesignKorv e-commerce platform to Hostinger web hosting.

> **IMPORTANT**: Before deploying, consider clearing test data from your database to start fresh. Use the provided script by running:
> ```bash
> # Make the script executable
> chmod +x clear-db.sh
> # Run the script
> ./clear-db.sh
> ```
> This will keep your admin account and site settings but clear all products, orders, and other test data.

## Prerequisites

1. A Hostinger hosting account (Business or Premium plan recommended)
2. Access to your Hostinger cPanel
3. Domain configured with Hostinger
4. Node.js support enabled on your Hostinger plan

## Step 1: Prepare Your Application for Deployment

1. Build your application locally:
   ```bash
   npm run build
   ```

2. Then run the cPanel preparation script:
   ```bash
   node build-for-cpanel.js
   ```
   This script will create the necessary files for cPanel deployment.

## Step 2: Set Up PostgreSQL Database on Hostinger

Hostinger offers PostgreSQL databases on their higher-tier plans:

1. Log in to your Hostinger cPanel
2. Navigate to "PostgreSQL Databases"
3. Create a new database (e.g., `designkorv`)
4. Create a new database user with a strong password
5. Assign the user to the database with all privileges
6. Note down the database details:
   - Database name
   - Database username
   - Database password
   - Database host (usually localhost)
   - Database port (usually 5432)

## Step 3: Upload Your Files to Hostinger

You can upload files using either FTP or the cPanel File Manager:

### Using File Manager:

1. Log in to your Hostinger cPanel
2. Open the File Manager
3. Navigate to the `public_html` directory (or a subdirectory if you prefer)
4. Upload the following files/folders:
   - `dist/` (contains server and client build)
   - `node_modules/` (dependencies)
   - `uploads/` (user uploaded files)
   - `.htaccess` (Apache configuration)
   - `cjs-adapter.cjs` (entry point for cPanel)
   - `index.html` (main HTML file)
   - `passenger-nodejs.json` (Node.js configuration)
   - `.cpanel.yml` (cPanel deployment configuration)

### Using FTP:

1. Connect to your Hostinger server using an FTP client (like FileZilla)
2. Upload the same files/folders listed above to your website directory

## Step 4: Configure Your Environment

1. Create a `.env` file in your website root directory (based on `.env.cpanel`):
   ```
   # Database Configuration
   DATABASE_URL=postgresql://username:password@hostname:port/database_name
   PGUSER=username
   PGPASSWORD=password
   PGHOST=hostname
   PGPORT=5432
   PGDATABASE=database_name
   
   # Security
   SESSION_SECRET=your_random_secure_session_secret_here
   
   # Payment Gateways
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   
   # Production Settings
   NODE_ENV=production
   PORT=3000
   ```

2. Replace the placeholder values with your actual database credentials and API keys.

## Step 5: Set Up Node.js Application

Hostinger provides a Node.js Application Manager in cPanel:

1. Log in to your Hostinger cPanel
2. Navigate to "Node.js" or "Setup Node.js App"
3. Click "Create Application"
4. Configure the application:
   - Application Path: Your website directory path (e.g., `/home/username/public_html` or your subdirectory)
   - Application URL: Your domain or subdomain
   - Application Root: The directory containing your application files
   - Application Startup File: `cjs-adapter.cjs`
   - Node.js Version: Select version 18.x or higher
   - Application Environment: Select "Production"
   - Passenger Log File: Leave default or specify a custom path
   - Enable "Run NPM Install" if available

5. Click "Create" to set up your Node.js application

## Step 6: Set Up Database Schema

To initialize your database schema:

1. Access SSH terminal in cPanel (Terminal feature)
2. Navigate to your website directory
3. Run the database migration command:
   ```bash
   npx drizzle-kit push
   ```

## Step 7: Verify Deployment

1. Open your website in a browser
2. Check that all pages load correctly
3. Test functionality (user login, product browsing, etc.)
4. Check the error logs in cPanel if you encounter any issues

## Step 8: Set Up SSL (HTTPS)

1. In Hostinger cPanel, navigate to "SSL/TLS Status"
2. Install/enable SSL for your domain
3. Force HTTPS redirection by ensuring your `.htaccess` file contains:
   ```
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

## Troubleshooting

### Common Issues:

1. **Application not starting**: Check the Node.js application logs in cPanel
2. **Database connection errors**: Verify your database credentials and connection string
3. **File permission issues**: Set proper permissions (755 for directories, 644 for files)
4. **Node.js version compatibility**: Ensure Hostinger supports your required Node.js version
5. **Passenger errors**: If using Passenger, check Passenger configuration and logs

### Hostinger-Specific Solutions:

- If your app won't start or shows 503 errors, try creating a `passenger-nodejs.json` file:
  ```json
  {
    "script": "cjs-adapter.cjs",
    "environment": "production",
    "port": 3000
  }
  ```

- For memory issues, consider upgrading your Hostinger plan to a higher tier for more resources

## Hostinger-Specific Notes

### Selecting the Right Hostinger Plan

For the DesignKorv application, you'll need these features:
- Node.js support
- PostgreSQL database 
- SSH access

These features are typically available on Hostinger's Business or Premium hosting plans. The Cloud VPS plans would also work well for this application.

### Application Root Directory

After logging in to Hostinger cPanel, you might find your website's root directory at:
```
/home/username/public_html/
```

Replace `username` with your actual Hostinger username. This is where you should upload all your application files.

### Database Connection

Hostinger's PostgreSQL connection string follows this format:
```
postgresql://username:password@localhost:5432/database_name
```

If you experience database connection issues, try these troubleshooting steps:
1. Confirm the database service is running in your Hostinger plan
2. Verify the PostgreSQL port (usually 5432, but may be different)
3. Check that your database user has the correct permissions

### Node.js Version Support

Hostinger typically supports Node.js versions 14, 16, 18, and 20. Make sure to select a version compatible with your application (18.x or higher recommended for DesignKorv).

## Additional Resources

- [Hostinger cPanel Guide](https://www.hostinger.com/tutorials/cpanel/how-to-use-cpanel)
- [Hostinger Node.js Hosting](https://www.hostinger.com/tutorials/how-to-install-node-js)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Hostinger PostgreSQL Setup](https://support.hostinger.com/en/articles/4455931-how-to-set-up-and-access-postgresql)