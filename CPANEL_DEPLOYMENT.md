# DesignKorv cPanel Deployment Guide

This guide will help you deploy DesignKorv on a cPanel hosting environment.

## Prerequisites

1. A cPanel hosting account with:
   - Node.js 18+ support
   - PostgreSQL database
   - SSH access (recommended)

## Step 1: Database Setup

1. Log in to your cPanel account
2. Go to "PostgreSQL Databases" or "Database Wizard" 
3. Create a new PostgreSQL database and user
4. Note down the following information:
   - Database name
   - Database username
   - Database password
   - Database host (usually localhost)
   - Database port (usually 5432)

## Step 2: Application Upload

1. Upload the entire application to your hosting directory (e.g., `public_html` or a subdirectory)
2. Ensure all files and folders are uploaded, especially:
   - `/client` directory
   - `/server` directory
   - `/shared` directory
   - All configuration files in the root directory

## Step 3: Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database_name
DB_SSL_MODE=disable  # Set to 'disable' if your cPanel PostgreSQL doesn't support SSL

# Session
SESSION_SECRET=your_random_session_secret_key

# Stripe (if applicable)
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

Replace the placeholders with your actual values.

## Step 4: Install Dependencies

1. Connect to your server via SSH
2. Navigate to your application directory
3. Run:
   ```
   npm install
   ```

## Step 5: Build the Application

1. Run the build command:
   ```
   npm run build
   ```

## Step 6: Set Up Database Schema

1. Run the database schema push command:
   ```
   npm run db:push
   ```

## Step 7: Start the Application

1. Set up a Node.js application in cPanel:
   - Go to "Setup Node.js App" in cPanel
   - Select your application directory
   - Set the Node.js version (18.x or higher)
   - Set the application startup file to `dist/index.js`
   - Set the application mode to "Production"
   - Enable "Run application in the background"

2. Start the application

## Step 8: Custom Domain Setup (Optional)

1. Configure your domain or subdomain to point to the application directory
2. Set up SSL certificate for secure HTTPS access

## Troubleshooting

### Database Connection Issues
- Verify your DATABASE_URL is correct
- Try setting `DB_SSL_MODE=disable` if you encounter SSL connection issues
- Ensure your database user has proper permissions

### Application Not Loading
- Check Node.js application logs in cPanel
- Verify the application is running with `npm run start`
- Check file permissions (files should be readable)

### Stripe Payment Issues
- Verify your Stripe API keys are set correctly
- Ensure your Stripe account is properly configured
- Check that webhook endpoints are properly set up if using webhooks

## Maintenance

- To update the application, repeat steps 2, 4, 5, and restart the Node.js application
- Regularly back up your database
- Monitor disk space and resource usage through cPanel

For additional help, refer to your hosting provider's documentation or contact their support team.