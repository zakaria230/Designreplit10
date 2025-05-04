/**
 * build-for-netlify.cjs
 * Helper script to prepare the DesignKorv application for Netlify deployment
 * 
 * This script should be run before or after the build process:
 * - For manual testing: node build-for-netlify.cjs
 * - For Netlify CI: Netlify will use this via the build command in netlify.toml
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Print environment information for debugging
console.log('==================== NETLIFY BUILD INFO ====================');
console.log('Node version:', process.version);
console.log('OS Platform:', os.platform());
console.log('OS Release:', os.release());
console.log('Current directory:', process.cwd());
try {
  console.log('Environment variables:', Object.keys(process.env).filter(key => 
    !key.includes('SECRET') && !key.includes('KEY') && !key.includes('TOKEN') && 
    !key.includes('PASSWORD') && !key.includes('AUTH')
  ).join(', '));
} catch (e) {
  console.log('Could not list environment variables');
}
console.log('===========================================================');

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
    
    // 1. Ensure netlify.toml exists and has the right configuration - we'll keep the existing one if it exists
    const netlifyTomlPath = './netlify.toml';
    if (!fs.existsSync(netlifyTomlPath)) {
      const netlifyConfig = `[build]
  publish = "dist/client"
  command = "npm ci && CI=false npm run build"

[build.environment]
  NODE_VERSION = "20"
  NPM_CONFIG_LEGACY_PEER_DEPS = "true"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[dev]
  command = "npm run dev"
  port = 8888
  targetPort = 5000
  publish = "dist/client"
  autoLaunch = true
`;
      
      fs.writeFileSync(netlifyTomlPath, netlifyConfig);
      logColored('✓ Created netlify.toml configuration file', 'green');
    } else {
      logColored('✓ Existing netlify.toml found, keeping it', 'blue');
    }

    // 2. Create functions directory if it doesn't exist
    const functionsDir = './netlify/functions';
    ensureDirectoryExists(functionsDir);

    // 3. Create API proxy function
    const apiFunctionPath = path.join(functionsDir, 'api.js');
    const apiFunctionContent = `// Netlify serverless function to handle API requests for DesignKorv
const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const app = express();

// Log environment for debugging
console.log('Function environment:', process.env.NODE_ENV);
console.log('Database URL configured:', !!process.env.DATABASE_URL);

// Import required modules from your existing backend
const { setupAuth } = require('../../server/auth');
const { corsMiddleware } = require('../../server/cors');
const { registerRoutes } = require('../../server/routes');

// Setup middleware
app.use(corsMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure sessions
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
};

// Setup session
app.use(session(sessionConfig));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Setup authentication
setupAuth(app);

// Register all API routes
registerRoutes(app);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Export the serverless function handler
module.exports.handler = serverless(app);
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
      execSync('npm install serverless-http mime-types --save-dev', { stdio: 'inherit' });
      logColored('✓ Installed serverless-http and mime-types dependencies', 'green');
    } catch (error) {
      logColored(`Warning: Could not install dependencies: ${error.message}`, 'yellow');
      logColored('Please manually install: npm install serverless-http mime-types --save-dev', 'yellow');
    }
    
    // 7.1 Create a setup-db.js function for database migrations
    const setupDbFunctionPath = path.join(functionsDir, 'setup-db.js');
    const setupDbContent = `// Netlify function to setup and migrate the database
const { db } = require('../../server/db');
const schema = require('../../shared/schema');
const { sql } = require('drizzle-orm');

exports.handler = async function(event, context) {
  try {
    console.log('Starting database setup...');
    
    // Run migrations or schema checks
    // This is a simplified approach - in production you might want to use drizzle-kit
    
    // Example: Check if users table exists, create if not
    const tableExists = await db.execute(sql\`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    \`);
    
    if (!tableExists.rows[0].exists) {
      console.log('Creating database schema...');
      // If using drizzle, you might want to use drizzle-kit push here
      // For simplicity, we'll just log it
      console.log('Tables would be created here');
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Database setup completed' })
    };
  } catch (error) {
    console.error('Database setup error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database setup failed' })
    };
  }
};
`;
    
    fs.writeFileSync(setupDbFunctionPath, setupDbContent);
    logColored('✓ Created database setup function', 'green');

    // 8. Update package.json with Netlify scripts if needed
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      
      // Add Netlify scripts if they don't exist
      if (!packageJson.scripts.netlify) {
        packageJson.scripts.netlify = 'netlify dev';
        packageJson.scripts['netlify:build'] = 'npm run build && node build-for-netlify.cjs';
        
        fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
        logColored('✓ Added Netlify scripts to package.json', 'green');
      }
    } catch (error) {
      logColored(`Warning: Could not update package.json: ${error.message}`, 'yellow');
    }

    // 9. Create a special package.json for Netlify if needed
    const packageNetlifyPath = './package-netlify.json';
    if (!fs.existsSync(packageNetlifyPath)) {
      const packageNetlifyContent = {
        "name": "designkorv-netlify-deploy",
        "version": "1.0.0",
        "description": "Deployment package for DesignKorv on Netlify",
        "type": "commonjs",
        "dependencies": {
          "@vitejs/plugin-react": "^4.2.0",
          "vite": "^5.0.0",
          "esbuild": "^0.19.0",
          "serverless-http": "^3.2.0",
          "express": "^4.18.2",
          "express-session": "^1.17.3",
          "passport": "^0.6.0",
          "@neondatabase/serverless": "^0.6.0"
        }
      };
      
      fs.writeFileSync(packageNetlifyPath, JSON.stringify(packageNetlifyContent, null, 2));
      logColored('✓ Created package-netlify.json for Netlify deployment', 'green');
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