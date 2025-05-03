# Fixing 503 Service Unavailable Error on Hostinger

This guide provides step-by-step instructions to troubleshoot and fix the 503 Service Unavailable error you're encountering on your Hostinger deployment.

## What Causes 503 Errors?

A 503 Service Unavailable error occurs when the server is temporarily unable to handle the request. For Node.js applications on Hostinger, this typically happens when:

1. The Node.js application fails to start
2. Passenger (the application server) has configuration issues
3. Memory limitations are being hit
4. Path configurations are incorrect

## Step-by-Step Fix

### 1. Update your .htaccess File

Replace your current .htaccess file with the following content:

```apache
# Rewrite rules for DesignKorv cPanel deployment
RewriteEngine On

# Ensure https
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Static files - serve directly
RewriteCond %{REQUEST_URI} .(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|map)$ [NC]
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule .* - [L]

# If the requested resource exists as a file or directory, serve it directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Handle front-end routes - send React/frontend routes to index.html
RewriteCond %{REQUEST_URI} !^/api/ [NC]
RewriteCond %{REQUEST_URI} !^/socket.io/ [NC]
RewriteCond %{REQUEST_URI} !^/ws/ [NC]
RewriteCond %{REQUEST_URI} !^/uploads/ [NC]
RewriteRule ^(.*)$ /index.html [L]

# Passenger configuration for Node.js
<IfModule mod_passenger.c>
    PassengerNodejs /opt/alt/alt-nodejs18/root/usr/bin/node
    PassengerAppType node
    PassengerStartupFile cjs-adapter.cjs
    # Use correct path with no leading slash
    PassengerAppRoot public_html
    PassengerFriendlyErrorPages on
</IfModule>

# PHP Fallback
<IfModule mod_php.c>
    # PHP is not needed, redirect to Node.js
    RedirectMatch 301 ^/$ /index.html
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "upgrade-insecure-requests;"
</IfModule>

# File permissions
<FilesMatch "\.(env|htaccess|htpasswd|ini|log|yml|yaml|config|db)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

### 2. Update passenger-nodejs.json

Create or update your `passenger-nodejs.json` file with the following content:

```json
{
  "script": "cjs-adapter.cjs",
  "args": [],
  "env": {
    "NODE_ENV": "production"
  },
  "exec_mode": "fork",
  "instances": 1,
  "mergeLogs": true,
  "watch": false,
  "autorestart": true,
  "max_memory_restart": "150M"
}
```

### 3. Check Node.js Setup in Hostinger

1. Log in to your Hostinger cPanel
2. Go to "Node.js" or "Setup Node.js App"
3. Make sure:
   - Node.js version is set to 18.x or higher
   - Application path points to your public_html directory
   - Application entry point is set to `cjs-adapter.cjs`
   - Environment is set to "Production"

### 4. Verify All Required Files

Make sure you have uploaded all necessary files to your Hostinger server:

- `cjs-adapter.cjs` in the public_html directory
- `.htaccess` in the public_html directory
- `passenger-nodejs.json` in the public_html directory
- `dist/` directory with your built application
- `node_modules/` directory with all dependencies
- `uploads/` directory for user uploads
- `index.html` in the public_html directory

### 5. Check Environment Variables and Database Configuration

1. Make sure you have a `.env` file with the correct database configuration:

```
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/databasename
PGUSER=username
PGPASSWORD=password
PGHOST=localhost
PGDATABASE=databasename
PGPORT=5432

# Other critical environment variables
SESSION_SECRET=your_secure_secret
NODE_ENV=production
PORT=3000
```

2. Verify that your database exists and is accessible with the credentials provided

### 6. Check File Permissions

Set appropriate file permissions:

```bash
chmod 755 public_html
chmod 644 public_html/.htaccess
chmod 755 public_html/cjs-adapter.cjs
chmod -R 755 public_html/dist
chmod -R 755 public_html/node_modules
```

### 7. Check Error Logs

1. Log in to your Hostinger cPanel
2. Go to "Logs" > "Error Logs"
3. Look for relevant error messages that might give clues about what's failing

### 8. Restart the Node.js Application

1. In cPanel, go to the Node.js Application Manager
2. Find your application and click "Restart"

### 9. Test the Application

Access your website to see if the 503 error is resolved.

## Additional Troubleshooting

If you're still seeing the 503 error after following these steps:

1. **Lower Memory Usage**: Try disabling unnecessary features or reducing the memory footprint
2. **Check Passenger Compatibility**: Make sure Hostinger's version of Passenger is compatible with your Node.js version
3. **Try Direct Node.js Execution**: If available, use SSH to run your application manually to see any error output
4. **Contact Hostinger Support**: If all else fails, reach out to Hostinger support with your error logs for assistance

Remember to clear your browser cache after making changes, as 503 responses might be cached.