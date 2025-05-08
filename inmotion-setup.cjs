#!/usr/bin/env node

/**
 * inmotion-setup.cjs
 * Script to prepare files for InMotion hosting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function createServerFile() {
  const serverContent = `// Simple Express server for InMotion
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'dist/client')));

// Serve uploaded files
if (fs.existsSync(path.join(__dirname, 'uploads'))) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Simple API endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DesignKorv API is running' });
});

// Serve SPA for any other route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(__dirname, 'dist/client/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

// Export for cPanel/InMotion
module.exports = app;
`;

  fs.writeFileSync('app.js', serverContent);
  logColored('Created app.js', 'green');
}

function createPackageJson() {
  const packageContent = {
    "name": "designkorv",
    "version": "1.0.0",
    "main": "app.js",
    "dependencies": {
      "express": "^4.18.2"
    },
    "scripts": {
      "start": "node app.js"
    }
  };

  fs.writeFileSync('package.inmotion.json', JSON.stringify(packageContent, null, 2));
  logColored('Created package.inmotion.json', 'green');
}

function createPassengerConfig() {
  const passengerContent = {
    "app_type": "node",
    "startup_file": "app.js",
    "node_version": "18"
  };

  fs.writeFileSync('passenger-nodejs.json', JSON.stringify(passengerContent, null, 2));
  logColored('Created passenger-nodejs.json', 'green');
}

function createReadme() {
  const readmeContent = `# InMotion Hosting Setup Guide

## Files prepared:
- app.js: Simple Express server that serves the static files
- package.inmotion.json: Simplified package.json for InMotion
- passenger-nodejs.json: Configuration for Passenger

## Deployment Instructions:

### 1. Build the application
\`\`\`bash
npm run build
\`\`\`

### 2. Copy these files to your InMotion hosting:
- dist/ folder (contains the built client application)
- uploads/ folder (contains uploaded images)
- app.js (rename package.inmotion.json to package.json)
- package.inmotion.json (rename to package.json on the server)
- passenger-nodejs.json

### 3. Setup Node.js application in InMotion:
- Application startup file: app.js
- Node.js version: 18.x
- Environment: Production

### 4. Install Express on the server
\`\`\`bash
cd ~/your_app_directory
npm install express
\`\`\`

### 5. Restart the Node.js application

## Debugging
If you encounter issues, check the following:
- logs in ~/logs directory
- Make sure all files were uploaded correctly
- Ensure Express is installed
`;

  fs.writeFileSync('INMOTION_HOSTING.md', readmeContent);
  logColored('Created INMOTION_HOSTING.md', 'green');
}

function createHtaccess() {
  const htaccessContent = `# Enable rewrite engine
RewriteEngine On

# If a file or directory doesn't exist
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Exclude /uploads from the rewrite rules
RewriteCond %{REQUEST_URI} !^/uploads/

# Rewrite all requests to the Node.js application
RewriteRule ^(.*)$ app.js/$1 [L,QSA]`;

  fs.writeFileSync('.htaccess', htaccessContent);
  logColored('Created .htaccess', 'green');
}

async function prepareForInMotion() {
  console.log('=======================================');
  logColored('Preparing files for InMotion hosting', 'bright');
  console.log('=======================================');

  try {
    createServerFile();
    createPackageJson();
    createPassengerConfig();
    createReadme();
    createHtaccess();

    console.log('=======================================');
    logColored('Files created successfully!', 'green');
    console.log('=======================================');
    console.log('');
    logColored('Next steps:', 'bright');
    console.log('1. Build your application: npm run build');
    console.log('2. Follow instructions in INMOTION_HOSTING.md');
    console.log('');
  } catch (error) {
    logColored(`Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Execute the preparation
prepareForInMotion();