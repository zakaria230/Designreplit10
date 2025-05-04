/**
 * build-for-netlify.js
 * Helper script to prepare the DesignKorv application for Netlify deployment
 * 
 * Run this script after building the application:
 * 1. npm run build
 * 2. node build-for-netlify.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color for console logs
function logColored(message, color) {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
  };
  console.log(colors[color] + message + colors.reset);
}

// Create directory if it doesn't exist
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    logColored(`Created directory: ${directory}`, 'green');
  }
}

// Copy file with proper error handling
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    logColored(`Copied ${source} to ${destination}`, 'green');
  } catch (error) {
    logColored(`Error copying ${source} to ${destination}: ${error.message}`, 'red');
  }
}

async function prepareForNetlify() {
  try {
    logColored('Starting Netlify deployment preparation...', 'blue');
    
    // 1. Ensure netlify.toml exists and has the right configuration
    const netlifyTomlPath = './netlify.toml';
    const netlifyConfig = `[build]
  publish = "dist/client"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
    
    fs.writeFileSync(netlifyTomlPath, netlifyConfig);
    logColored('✓ Updated netlify.toml configuration file', 'green');

    // 2. Create functions directory if it doesn't exist
    const functionsDir = './netlify/functions';
    ensureDirectoryExists(functionsDir);

    // 3. Create API proxy function
    const apiFunctionPath = path.join(functionsDir, 'api.js');
    const apiFunctionContent = `// Netlify serverless function to handle API requests
const express = require('express');
const serverless = require('netlify-lambda');
const app = express();

// Import your server routes
const { registerRoutes } = require('../../server/routes');

// Setup your Express app
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register your API routes
registerRoutes(app);

// Export the Lambda handler
exports.handler = serverless.createHandler(app);
`;
    
    fs.writeFileSync(apiFunctionPath, apiFunctionContent);
    logColored('✓ Created API proxy function for Netlify Functions', 'green');

    // 4. Create or copy _redirects file to both public and dist folders
    const redirectsContent = `# Netlify redirects file
# This file ensures that all routes are handled by the React application

# API requests are handled by Netlify Functions
/api/*  /.netlify/functions/api/:splat  200

# All other routes go to the React app
/*      /index.html                     200
`;
    
    // Write to public folder for development
    fs.writeFileSync('./public/_redirects', redirectsContent);
    logColored('✓ Updated _redirects file in public directory', 'green');
    
    // Ensure dist/client exists
    ensureDirectoryExists('./dist/client');
    
    // Write to dist/client for production
    fs.writeFileSync('./dist/client/_redirects', redirectsContent);
    logColored('✓ Created _redirects file in dist/client directory', 'green');

    // 5. Create a robots.txt file if it doesn't exist
    const robotsContent = `# Allow all robots
User-agent: *
Allow: /

# Sitemap location
Sitemap: https://your-netlify-app.netlify.app/sitemap.xml
`;
    
    fs.writeFileSync('./public/robots.txt', robotsContent);
    logColored('✓ Created robots.txt file', 'green');

    // 6. Ensure the client/index.html is present in the build output
    if (fs.existsSync('./client/index.html')) {
      // Make sure dist/client exists
      ensureDirectoryExists('./dist/client');
      
      // Copy the index.html to dist/client if it doesn't exist there
      if (!fs.existsSync('./dist/client/index.html')) {
        copyFile('./client/index.html', './dist/client/index.html');
      }
    }

    // 7. Install necessary packages for Netlify Functions
    logColored('Installing necessary packages for Netlify Functions...', 'blue');
    try {
      execSync('npm install netlify-lambda serverless-http --save-dev', { stdio: 'inherit' });
      logColored('✓ Installed Netlify Function dependencies', 'green');
    } catch (error) {
      logColored(`Warning: Could not install Netlify Function dependencies: ${error.message}`, 'yellow');
      logColored('Please manually install: npm install netlify-lambda serverless-http --save-dev', 'yellow');
    }

    // 8. Update package.json with Netlify scripts if needed
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      
      // Add Netlify scripts if they don't exist
      if (!packageJson.scripts.netlify) {
        packageJson.scripts.netlify = 'netlify dev';
        packageJson.scripts['netlify:build'] = 'npm run build && node build-for-netlify.js';
        
        fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
        logColored('✓ Added Netlify scripts to package.json', 'green');
      }
    } catch (error) {
      logColored(`Warning: Could not update package.json: ${error.message}`, 'yellow');
    }

    logColored('\n✅ Netlify deployment preparation completed successfully!', 'green');
    logColored('\nNext steps:', 'blue');
    logColored('1. Connect your repository to Netlify', 'blue');
    logColored('2. Set environment variables in Netlify dashboard:', 'blue');
    logColored('   - DATABASE_URL', 'blue');
    logColored('   - SESSION_SECRET', 'blue'); 
    logColored('   - STRIPE_SECRET_KEY', 'blue');
    logColored('   - VITE_STRIPE_PUBLIC_KEY', 'blue');
    logColored('   - PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET', 'blue');
    logColored('3. Deploy your site with: netlify deploy --prod', 'blue');
    
  } catch (error) {
    logColored(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

prepareForNetlify();