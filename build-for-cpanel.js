#!/usr/bin/env node

/**
 * build-for-cpanel.js
 * Helper script to prepare the application for cPanel deployment
 * 
 * Run this script after the normal build process:
 * 1. npm run build
 * 2. node build-for-cpanel.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function logColored(message, color) {
  console.log(colors[color] + message + colors.reset);
}

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    logColored(`Created directory: ${directory}`, 'green');
  }
}

async function prepareForCPanel() {
  console.log('\n============================================');
  logColored('DesignKorv - Preparing for cPanel Deployment', 'bright');
  console.log('============================================\n');

  try {
    // 1. Check if the build exists
    if (!fs.existsSync('./dist')) {
      logColored('Error: Build directory not found. Run "npm run build" first.', 'red');
      process.exit(1);
    }

    // 2. Copy the CommonJS server file
    if (!fs.existsSync('./server.cjs')) {
      logColored('Creating server.cjs...', 'yellow');
      fs.copyFileSync('./server.js', './server.cjs');
      logColored('Created server.cjs', 'green');
    } else {
      logColored('server.cjs already exists', 'blue');
    }

    // 3. Set up package.cpanel.json if it doesn't exist
    if (!fs.existsSync('./package.cpanel.json')) {
      logColored('Creating package.cpanel.json...', 'yellow');
      const packageJson = {
        name: "designkorv",
        version: "1.0.0",
        private: true,
        license: "MIT",
        scripts: {
          start: "NODE_ENV=production node server.cjs"
        },
        dependencies: {
          "@hookform/resolvers": "latest",
          "@neondatabase/serverless": "latest",
          "@paypal/checkout-server-sdk": "latest",
          "class-variance-authority": "latest",
          "clsx": "latest",
          "connect-pg-simple": "latest",
          "date-fns": "latest",
          "drizzle-orm": "latest",
          "drizzle-zod": "latest",
          "express": "latest",
          "express-fileupload": "latest",
          "express-rate-limit": "latest",
          "express-session": "latest",
          "lucide-react": "latest",
          "memorystore": "latest",
          "passport": "latest",
          "passport-local": "latest",
          "react": "latest",
          "react-dom": "latest",
          "react-hook-form": "latest",
          "stripe": "latest",
          "tailwind-merge": "latest",
          "zod": "latest"
        }
      };
      
      fs.writeFileSync(
        './package.cpanel.json',
        JSON.stringify(packageJson, null, 2)
      );
      logColored('Created package.cpanel.json', 'green');
    } else {
      logColored('package.cpanel.json already exists', 'blue');
    }

    // 4. Create the passenger-nodejs.json file for cPanel settings
    if (!fs.existsSync('./passenger-nodejs.json')) {
      logColored('Creating passenger-nodejs.json...', 'yellow');
      const passengerConfig = {
        "app_type": "node",
        "startup_file": "cjs-adapter.cjs",
        "node_version": "18"
      };
      
      fs.writeFileSync(
        './passenger-nodejs.json',
        JSON.stringify(passengerConfig, null, 2)
      );
      logColored('Created passenger-nodejs.json', 'green');
    } else {
      logColored('passenger-nodejs.json already exists', 'blue');
    }

    // 5. Create .htaccess file for proper handling of routes
    if (!fs.existsSync('./.htaccess')) {
      logColored('Creating .htaccess file...', 'yellow');
      const htaccessContent = `
# Enable rewrite engine
RewriteEngine On

# If a file or directory doesn't exist
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Exclude /uploads from the rewrite rules
RewriteCond %{REQUEST_URI} !^/uploads/

# Rewrite all requests to the Node.js application
RewriteRule ^(.*)$ app.js/$1 [L,QSA]
      `;
      
      fs.writeFileSync('./.htaccess', htaccessContent.trim());
      logColored('Created .htaccess file', 'green');
    } else {
      logColored('.htaccess already exists', 'blue');
    }

    // 6. Create a ZIP file with all necessary files for cPanel
    logColored('Creating deployment package...', 'yellow');
    const deploymentFiles = [
      './dist/**/*',
      './uploads/**/*',
      './server.cjs',
      './cjs-adapter.cjs',
      './passenger-nodejs.json',
      './package.cpanel.json',
      './.htaccess',
      './node_modules/**/*'
    ];
    
    // Print deployment instructions
    console.log('\n============================================');
    logColored('Deployment Instructions for cPanel', 'bright');
    console.log('============================================');
    
    logColored('1. Upload these files to your cPanel hosting:', 'cyan');
    deploymentFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    
    logColored('\n2. In cPanel, set up the following:', 'cyan');
    console.log('   - Node.js app with:');
    console.log('     * Application mode: Production');
    console.log('     * Node.js version: 18.x');
    console.log('     * Application root: Your website root directory');
    console.log('     * Application URL: Your domain or subdomain');
    console.log('     * Application startup file: cjs-adapter.cjs');
    
    logColored('\n3. On your server, rename files:', 'cyan');
    console.log('   - Rename package.cpanel.json to package.json');
    
    logColored('\n4. Create a .env file with:', 'cyan');
    console.log('   NODE_ENV=production');
    console.log('   DATABASE_URL=your_database_url');
    console.log('   # ... and other required environment variables');
    
    logColored('\n5. Restart your Node.js application', 'cyan');
    
    console.log('\n============================================');
    logColored('Preparation complete!', 'green');
    console.log('============================================\n');

  } catch (error) {
    logColored(`Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Execute the main function
prepareForCPanel();