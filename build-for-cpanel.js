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
const { execSync } = require('child_process');

// Paths
const CLIENT_BUILD_PATH = path.join(__dirname, 'dist', 'client');
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');
const CJS_ADAPTER_PATH = path.join(__dirname, 'cjs-adapter.cjs');
const HTACCESS_PATH = path.join(__dirname, '.htaccess');
const CPANEL_ENV_PATH = path.join(__dirname, '.env.cpanel');

// Colors for console output
const COLORS = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m'
};

// Log with color
function logColored(message, color) {
  console.log(`${color}${message}${COLORS.reset}`);
}

// Create directory if it doesn't exist
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    logColored(`Created directory: ${directory}`, COLORS.green);
  }
}

// Main function
async function prepareForCPanel() {
  try {
    logColored('🚀 Preparing build for cPanel deployment...', COLORS.cyan);
    
    // 1. Ensure the client build files are available
    if (!fs.existsSync(CLIENT_BUILD_PATH)) {
      logColored('Error: Client build files not found. Run "npm run build" first.', COLORS.red);
      process.exit(1);
    }
    
    // 2. Create index.html in the project root
    logColored('Creating index.html in project root...', COLORS.yellow);
    fs.copyFileSync(
      path.join(CLIENT_BUILD_PATH, 'index.html'),
      INDEX_HTML_PATH
    );
    
    // 3. Verify CJS adapter exists
    if (!fs.existsSync(CJS_ADAPTER_PATH)) {
      logColored('Error: cjs-adapter.cjs not found', COLORS.red);
      process.exit(1);
    }
    
    // 4. Verify .htaccess exists
    if (!fs.existsSync(HTACCESS_PATH)) {
      logColored('Error: .htaccess not found', COLORS.red);
      process.exit(1);
    }
    
    // 5. Create cpanel deployment instructions
    logColored('Creating .env.cpanel template...', COLORS.yellow);
    const envTemplate = `# DesignKorv cPanel Environment Configuration
# Rename this file to .env when deploying to cPanel

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
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Production Settings
NODE_ENV=production
PORT=3000
`;
    
    fs.writeFileSync(CPANEL_ENV_PATH, envTemplate);
    
    // 6. Print deployment instructions
    logColored('\n✅ Build for cPanel prepared successfully!', COLORS.green);
    logColored('\n📋 DEPLOYMENT INSTRUCTIONS:', COLORS.cyan);
    logColored('1. Upload the following files/folders to your cPanel hosting:', COLORS.yellow);
    logColored('   - dist/           (contains server and client build)', COLORS.yellow);
    logColored('   - node_modules/   (dependencies)', COLORS.yellow);
    logColored('   - uploads/        (user uploaded files)', COLORS.yellow);
    logColored('   - .htaccess       (Apache configuration)', COLORS.yellow);
    logColored('   - cjs-adapter.cjs (entry point for cPanel)', COLORS.yellow);
    logColored('   - index.html      (main HTML file)', COLORS.yellow);
    logColored('   - .env            (rename .env.cpanel and update with your values)', COLORS.yellow);
    logColored('\n2. Set up Node.js app in cPanel:', COLORS.yellow);
    logColored('   - Application mode: Production', COLORS.yellow);
    logColored('   - Node.js version: 18.x or higher', COLORS.yellow);
    logColored('   - Application root: Your website root directory', COLORS.yellow);
    logColored('   - Application URL: Your domain name', COLORS.yellow);
    logColored('   - Application startup file: cjs-adapter.cjs', COLORS.yellow);
    logColored('\n3. Initialize database (via SSH):', COLORS.yellow);
    logColored('   - Connect to your server via SSH', COLORS.yellow);
    logColored('   - Navigate to your website directory', COLORS.yellow);
    logColored('   - Run: node_modules/.bin/drizzle-kit push', COLORS.yellow);
    
    logColored('\nFor more details, see CPANEL_DEPLOYMENT_STEPS.md', COLORS.cyan);
    
  } catch (error) {
    logColored(`Error: ${error.message}`, COLORS.red);
    process.exit(1);
  }
}

// Run the build preparation
prepareForCPanel();