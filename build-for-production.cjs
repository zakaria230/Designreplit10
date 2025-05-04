/**
 * build-for-production.cjs
 * Master build script for DesignKorv production deployments
 * 
 * This script handles:
 * 1. Building the frontend and backend
 * 2. Preparing the codebase for Netlify deployment
 * 3. Performing necessary file modifications for compatibility
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

function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    logSuccess(`Copied ${source} to ${destination}`);
  } catch (error) {
    logError(`Failed to copy ${source} to ${destination}: ${error.message}`);
  }
}

function copyDirectory(source, destination) {
  try {
    ensureDirectoryExists(destination);
    
    const files = fs.readdirSync(source);
    logSuccess(`Found ${files.length} files/directories in ${source}`);
    
    for (const file of files) {
      const sourcePath = path.join(source, file);
      const destPath = path.join(destination, file);
      
      try {
        const stats = fs.statSync(sourcePath);
        
        if (stats.isDirectory()) {
          copyDirectory(sourcePath, destPath);
        } else {
          copyFile(sourcePath, destPath);
        }
      } catch (error) {
        logWarning(`Error processing file ${sourcePath}: ${error.message}`);
      }
    }
  } catch (error) {
    logError(`Error copying directory ${source} to ${destination}: ${error.message}`);
  }
}

// Create a redirects file to ensure client-side routing works
function createRedirectsFile() {
  try {
    const redirectsContent = [
      // API requests
      '/api/*  /.netlify/functions/api/:splat  200',
      // Diagnostic endpoints
      '/diagnose  /.netlify/functions/diagnose  200',
      '/_debug  /.netlify/functions/debug  200',
      '/db-check  /.netlify/functions/setup-db  200',
      // Fallback page
      '/fallback  /fallback.html  200',
      // Handle SPA routes
      '/*  /index.html  200',
    ].join('\n');
    
    // Make sure the directory exists
    ensureDirectoryExists('dist/client');
    
    // Write the file
    fs.writeFileSync('dist/client/_redirects', redirectsContent);
    logSuccess('Created _redirects file for client-side routing');
  } catch (error) {
    logError(`Failed to create _redirects file: ${error.message}`);
    // Continue execution, don't exit
  }
}

// Ensure diagnostic tools are copied to the right locations
function prepareDiagnosticTools() {
  try {
    // Copy diagnostic CSS file if it doesn't exist
    if (!fs.existsSync('dist/client/diagnostic.css') && fs.existsSync('public/diagnostic.css')) {
      copyFile('public/diagnostic.css', 'dist/client/diagnostic.css');
    }
    
    // Copy fallback HTML file if it doesn't exist
    if (!fs.existsSync('dist/client/fallback.html') && fs.existsSync('public/fallback.html')) {
      copyFile('public/fallback.html', 'dist/client/fallback.html');
    }
    
    // Copy diagnostic JS file if it doesn't exist
    if (!fs.existsSync('dist/client/build-info.js') && fs.existsSync('public/build-info.js')) {
      copyFile('public/build-info.js', 'dist/client/build-info.js');
    }
    
    logSuccess('Diagnostic tools prepared');
  } catch (error) {
    logWarning(`Failed to prepare diagnostic tools: ${error.message}`);
  }
}

// Main build process
async function buildForProduction() {
  try {
    console.log(`\n${COLORS.bright}${COLORS.cyan}=== DesignKorv Production Build Process ===${COLORS.reset}\n`);
    console.log(`${COLORS.dim}Starting build at: ${new Date().toISOString()}${COLORS.reset}\n`);
    
    // Step 1: Clean previous build artifacts
    logStep(1, 'Cleaning previous build artifacts');
    try {
      execSync('rm -rf dist');
      logSuccess('Previous build artifacts cleaned');
    } catch (error) {
      logWarning(`Failed to clean artifacts: ${error.message}`);
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
    
    // Step 3: Prepare frontend for Netlify
    logStep(3, 'Preparing frontend for Netlify');
    
    // Check if Vite built to dist/public instead of dist/client
    if (fs.existsSync('dist/public') && fs.existsSync('dist/public/index.html')) {
      logSuccess('Build output detected in dist/public, copying to dist/client');
      // Make sure dist/client directory exists
      ensureDirectoryExists('dist/client');
      
      // Copy all contents from dist/public to dist/client
      copyDirectory('dist/public', 'dist/client');
    } else {
      logWarning('Build output not found in dist/public, checking if it exists in dist/client directly');
    }
    
    // Make sure dist/client directory exists before creating files
    ensureDirectoryExists('dist/client');
    createRedirectsFile();
    prepareDiagnosticTools();
    
    // Step 4: Prepare backend for Netlify
    logStep(4, 'Preparing backend for Netlify');
    try {
      // Ensure netlify functions directory exists
      ensureDirectoryExists('netlify/functions');
      
      // Copy esbuild config if it doesn't exist
      if (!fs.existsSync('netlify/functions/esbuild.config.js')) {
        execSync('node build-for-netlify.cjs', { stdio: 'inherit' });
      }
      
      logSuccess('Backend preparation for Netlify completed');
    } catch (error) {
      logError(`Backend preparation failed: ${error.message}`);
      process.exit(1);
    }
    
    // Step 5: Verify build artifacts
    logStep(5, 'Verifying build artifacts');
    
    // Check if index.html exists
    if (!fs.existsSync('dist/client/index.html')) {
      logError('Missing index.html - the build is incomplete');
      process.exit(1);
    }
    
    // Check if redirects file exists
    if (!fs.existsSync('dist/client/_redirects')) {
      logWarning('Missing _redirects file - client-side routing may not work');
    }
    
    // Check if Netlify functions exist
    if (!fs.existsSync('netlify/functions/api.js')) {
      logWarning('Missing Netlify function api.js - API endpoints may not work');
    }
    
    // All checks passed
    logSuccess('Build verification completed');
    
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