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

1. A Hostinger hosting account (Either Premium or Business plan)
2. Access to your Hostinger cPanel
3. Domain configured with Hostinger
4. Node.js support enabled on your hosting plan

## Setup Steps

### 1. Prepare your project for deployment

1. Build your project locally:
   ```bash
   npm run build
   ```

2. Create a ZIP archive of your project:
   ```bash
   # Make sure node_modules is not included
   zip -r designkorv.zip . -x "node_modules/*" ".git/*"
   ```

### 2. Set up your database on Hostinger

1. Log in to your Hostinger cPanel
2. Navigate to the MySQL Databases section
3. Create a new database named `designkorv`
4. Create a new user with a strong password
5. Add the user to the database with all privileges
6. Note down the database name, username, password, and host for later use

### 3. Upload your project to Hostinger

#### Option 1: Using cPanel File Manager

1. Log in to your Hostinger cPanel
2. Navigate to the File Manager
3. Navigate to the public_html directory (or a subdirectory if you want to install in a subfolder)
4. Click on "Upload" and select your designkorv.zip file
5. Once uploaded, extract the ZIP file
6. Delete the ZIP file after extraction

#### Option 2: Using FTP

1. Use an FTP client (like FileZilla)
2. Connect to your Hostinger server using your FTP credentials
3. Navigate to the public_html directory (or your preferred installation directory)
4. Upload all your project files (excluding node_modules and .git directories)

### 4. Configure your environment

1. Create or update the `.env` file in your project root with your Hostinger database credentials:
   ```
   DATABASE_URL=mysql://username:password@hostname:3306/database_name
   SESSION_SECRET=your_session_secret
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   # Other environment variables as needed
   ```

2. Make sure your Node.js setup is configured. Create or update the `passenger-nodejs.json` file:
   ```json
   {
     "script": "dist/index.js",
     "environment": "production",
     "port": null
   }
   ```

### 5. Set up Node.js on Hostinger

1. In your Hostinger cPanel, locate the Node.js Application Manager
2. Click on "Create Application"
3. Set the application path to your project directory
4. Set the Node.js version to a compatible version (preferably 20.x)
5. Set the application startup file to `dist/index.js`
6. Set the application Environment to `production`
7. Save the configuration

### 6. Install dependencies and start the application

1. Access the SSH terminal in cPanel or use Hostinger's Terminal
2. Navigate to your project directory
3. Run the following commands:
   ```bash
   npm install --production
   npm run start
   ```

### 7. Configure your domain

1. In the Hostinger cPanel, navigate to the "Domains" section
2. Point your domain or subdomain to the directory where you uploaded your project
3. Make sure SSL is enabled for your domain

## Troubleshooting

### Common Issues:

1. **Node.js version issues**: Make sure your Hostinger plan supports the Node.js version required by your application
2. **Port binding errors**: Your application may need to use the specific port provided by Hostinger's environment
3. **Database connection issues**: Double-check your database credentials and connection string
4. **Permission errors**: You may need to set the correct file permissions (typically 755 for directories and 644 for files)

## Additional Resources

- [Hostinger Node.js Hosting Documentation](https://www.hostinger.com/tutorials/how-to-install-node-js)
- [cPanel Documentation](https://docs.cpanel.net/)
- [Node.js Deployment Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)