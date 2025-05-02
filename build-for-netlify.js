/**
 * build-for-netlify.js
 * Helper script to prepare the application for Netlify deployment
 * 
 * Run this script after building the application:
 * 1. npm run build
 * 2. node build-for-netlify.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

async function prepareForNetlify() {
  try {
    // Create netlify configuration file if it doesn't exist
    const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
    if (!fs.existsSync(netlifyTomlPath)) {
      const netlifyConfig = `[build]
  publish = "dist/client"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
      fs.writeFileSync(netlifyTomlPath, netlifyConfig);
      logColored('✓ Created netlify.toml configuration file', 'green');
    }

    // Create a _redirects file for Netlify
    const redirectsPath = path.join(__dirname, 'dist', 'client', '_redirects');
    ensureDirectoryExists(path.dirname(redirectsPath));
    
    const redirectsContent = `# Redirects API requests to the backend server
/api/*  https://your-backend-api-url.com/api/:splat  200
/*      /index.html                                  200
`;
    
    fs.writeFileSync(redirectsPath, redirectsContent);
    logColored('✓ Created _redirects file for Netlify', 'green');

    // Create or update .env file for frontend environment variables
    const envPath = path.join(__dirname, '.env.production');
    const envContent = `VITE_API_URL=https://your-backend-api-url.com
VITE_STRIPE_PUBLIC_KEY=${process.env.VITE_STRIPE_PUBLIC_KEY || 'your-stripe-public-key'}
`;
    
    fs.writeFileSync(envPath, envContent);
    logColored('✓ Created .env.production for environment variables', 'green');

    logColored('\n✅ Netlify deployment files prepared successfully!', 'green');
    logColored('\nNext steps:', 'blue');
    logColored('1. Update the backend API URL in dist/client/_redirects', 'yellow');
    logColored('2. Set up your backend service (Render, Railway, Heroku, etc.)', 'yellow');
    logColored('3. Deploy to Netlify using the Netlify CLI or GitHub integration', 'yellow');
    
  } catch (error) {
    logColored(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

prepareForNetlify();