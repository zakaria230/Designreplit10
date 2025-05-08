/**
 * build-for-production.cjs
 * Master build script for DesignKorv production deployments
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

// Main build process
async function buildForProduction() {
  try {
    console.log(`\n${COLORS.bright}${COLORS.cyan}=== DesignKorv Production Build Process ===${COLORS.reset}\n`);
    console.log(`${COLORS.dim}Starting build at: ${new Date().toISOString()}${COLORS.reset}\n`);
    
    // Step 1: Install required dependencies
    logStep(1, 'Installing required dependencies');
    try {
      execSync('npm install @vitejs/plugin-react vite esbuild --no-save', { stdio: 'inherit' });
      logSuccess('Dependencies installed');
    } catch (error) {
      logWarning(`Failed to install dependencies: ${error.message}`);
      logWarning('Continuing with build process...');
    }
    
    // Step 2: Build the project
    logStep(2, 'Building the project');
    try {
      // Create output directories first
      ensureDirectoryExists('dist');
      ensureDirectoryExists('dist/client');
      
      // Build for production (use CI=false to ignore warnings)
      execSync('CI=false npm run build', { stdio: 'inherit' });
      logSuccess('Project build completed');
    } catch (error) {
      logError(`Build failed: ${error.message}`);
      process.exit(1);
    }
    
    // Step 3: Create redirects file for Netlify
    logStep(3, 'Creating redirects file');
    try {
      const redirectsContent = [
        // API requests
        '/api/*  /.netlify/functions/api/:splat  200',
        // Fallback page
        '/*  /index.html  200',
      ].join('\n');
      
      fs.writeFileSync('dist/client/_redirects', redirectsContent);
      logSuccess('Created _redirects file');
    } catch (error) {
      logError(`Failed to create redirects file: ${error.message}`);
    }
    
    // Step 4: Prepare Netlify functions
    logStep(4, 'Preparing Netlify functions');
    try {
      // Ensure netlify functions directory exists
      ensureDirectoryExists('netlify/functions');
      
      // Create a simple API function if it doesn't exist
      if (!fs.existsSync('netlify/functions/api.js')) {
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
        logSuccess('Created API function');
      } else {
        logSuccess('API function already exists');
      }
    } catch (error) {
      logError(`Failed to prepare Netlify functions: ${error.message}`);
    }
    
    // Finish
    console.log(`\n${COLORS.bright}${COLORS.green}Build completed successfully at: ${new Date().toISOString()}${COLORS.reset}`);
    console.log(`${COLORS.bright}${COLORS.green}The project is ready for deployment to Netlify${COLORS.reset}\n`);
    
  } catch (error) {
    console.error(`${COLORS.bright}${COLORS.red}Build process failed: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

// Run the build process
buildForProduction();
