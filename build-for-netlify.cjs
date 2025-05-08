/**
 * build-for-netlify.cjs
 * Simplified build script for Netlify deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
function logStep(stepNumber, message) {
  console.log(`${COLORS.bright}${COLORS.blue}[${stepNumber}] ${message}${COLORS.reset}`);
}

function logSuccess(message) {
  console.log(`${COLORS.green}✓ ${message}${COLORS.reset}`);
}

function logWarning(message) {
  console.log(`${COLORS.yellow}⚠ ${message}${COLORS.reset}`);
}

function logError(message) {
  console.log(`${COLORS.red}✗ ${message}${COLORS.reset}`);
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

// Create a redirects file to ensure client-side routing works
function createRedirectsFile() {
  try {
    const redirectsContent = [
      // API requests
      '/api/*  /.netlify/functions/api/:splat  200',
      // Fallback page
      '/*  /index.html  200',
    ].join('\n');
    
    // Make sure the directory exists
    ensureDirectoryExists('dist/client');
    
    // Write the file
    fs.writeFileSync('dist/client/_redirects', redirectsContent);
    logSuccess('Created _redirects file for client-side routing');
  } catch (error) {
    logError(`Failed to create _redirects file: ${error.message}`);
  }
}

// Create a simple API function for Netlify
function createNetlifyFunction() {
  try {
    // Ensure the functions directory exists
    ensureDirectoryExists('netlify/functions');
    
    // Create a simple API function
    const apiFunctionContent = `
const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Add your API routes here
// app.get('/api/products', ...);

module.exports.handler = serverless(app);
`;
    
    fs.writeFileSync('netlify/functions/api.js', apiFunctionContent);
    logSuccess('Created Netlify function for API');
  } catch (error) {
    logError(`Failed to create Netlify function: ${error.message}`);
  }
}

// Main build process
async function prepareForNetlify() {
  try {
    console.log(`\n${COLORS.bright}${COLORS.cyan}=== DesignKorv Netlify Preparation ===${COLORS.reset}\n`);
    
    // Step 1: Ensure build directory exists
    logStep(1, 'Checking build directory');
    if (!fs.existsSync('dist/client')) {
      logWarning('Build directory not found. Make sure to run npm run build first.');
      ensureDirectoryExists('dist/client');
    } else {
      logSuccess('Build directory exists');
    }
    
    // Step 2: Create redirects file
    logStep(2, 'Creating redirects file');
    createRedirectsFile();
    
    // Step 3: Create Netlify function
    logStep(3, 'Creating Netlify function');
    createNetlifyFunction();
    
    // Step 4: Install serverless-http if needed
    logStep(4, 'Checking for serverless-http');
    try {
      require.resolve('serverless-http');
      logSuccess('serverless-http is already installed');
    } catch (error) {
      logWarning('serverless-http not found, installing...');
      try {
        execSync('npm install --save serverless-http', { stdio: 'inherit' });
        logSuccess('Installed serverless-http');
      } catch (installError) {
        logError(`Failed to install serverless-http: ${installError.message}`);
      }
    }
    
    console.log(`\n${COLORS.bright}${COLORS.green}Netlify preparation completed successfully!${COLORS.reset}\n`);
    
  } catch (error) {
    console.error(`${COLORS.bright}${COLORS.red}Preparation failed: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

// Run the preparation process
prepareForNetlify();


