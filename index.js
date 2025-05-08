/**
 * Desivoo - E-commerce Application - Production Server for cPanel
 * This server is designed to run on cPanel hosting with Node.js support
 */

// Import required modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const fileUpload = require('express-fileupload');

// Create Express application
const app = express();

// Environment setup
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
console.log(`Environment: ${process.env.NODE_ENV}`);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable file uploads
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Path configuration
const STATIC_PATH = path.join(__dirname, 'static');
const UPLOADS_PATH = path.join(__dirname, 'uploads');

// Log important paths
console.log(`Current directory: ${__dirname}`);
console.log(`Static files path: ${STATIC_PATH}`);
console.log(`Uploads path: ${UPLOADS_PATH}`);

// Session configuration with fallback for missing SESSION_SECRET
if (!process.env.SESSION_SECRET) {
  console.warn('No SESSION_SECRET defined, using default (not recommended for production)');
  process.env.SESSION_SECRET = 'desivoo-default-secret-key-for-development-only';
}

// Configure sessions (with in-memory store for simplicity)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if HTTPS is available
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from the static directory (frontend build)
if (fs.existsSync(STATIC_PATH)) {
  app.use(express.static(STATIC_PATH));
  console.log(`Serving static files from ${STATIC_PATH}`);
} else {
  console.error(`Warning: Static directory ${STATIC_PATH} does not exist`);
}

// Serve uploads directory
if (fs.existsSync(UPLOADS_PATH)) {
  app.use('/uploads', express.static(UPLOADS_PATH));
  console.log(`Serving uploads from ${UPLOADS_PATH}`);
} else {
  console.warn(`Warning: Uploads directory ${UPLOADS_PATH} does not exist`);
  // Create uploads directory if it doesn't exist
  try {
    fs.mkdirSync(UPLOADS_PATH, { recursive: true });
    console.log(`Created uploads directory at ${UPLOADS_PATH}`);
  } catch (err) {
    console.error(`Failed to create uploads directory: ${err.message}`);
  }
}

// Mock database for minimum functionality
const mockDb = {
  categories: [
    { id: 1, name: 'Trendy designs', slug: 'trendy-designs' },
    { id: 2, name: 'Vintage & Retro', slug: 'vintage-retro' },
    { id: 3, name: 'Bundles', slug: 'bundles' },
    { id: 4, name: 'Holidays & Events', slug: 'holidays-events' }
  ],
  products: [
    { 
      id: 1, 
      name: 'Retro Summer SVG Bundle', 
      slug: 'retro-summer-svg-bundle',
      price: 24.99,
      description: 'A collection of retro summer themed SVG designs',
      categoryId: 2
    }
  ],
  settings: {
    site: {
      site_name: 'Desivoo',
      site_description: 'Digital designs and bundles for crafters and designers',
      currency: 'USD',
      currency_symbol: '$'
    }
  }
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Desivoo API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Diagnostics endpoint
app.get('/api/diagnose', (req, res) => {
  const directories = {
    current: __dirname,
    static: STATIC_PATH,
    uploads: UPLOADS_PATH
  };
  
  const directoryContents = {};
  
  // Get contents of important directories
  for (const [name, dirPath] of Object.entries(directories)) {
    if (fs.existsSync(dirPath)) {
      try {
        directoryContents[name] = fs.readdirSync(dirPath);
      } catch (err) {
        directoryContents[name] = `Error reading directory: ${err.message}`;
      }
    } else {
      directoryContents[name] = 'Directory does not exist';
    }
  }
  
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    node_version: process.version,
    directories,
    directoryContents,
    env_vars: {
      NODE_ENV: process.env.NODE_ENV,
      SESSION_SECRET: process.env.SESSION_SECRET ? '(Set)' : '(Not set)',
      DATABASE_URL: process.env.DATABASE_URL ? '(Set)' : '(Not set)',
    }
  });
});

// Provide basic API responses for the frontend
app.get('/api/categories', (req, res) => {
  res.json(mockDb.categories);
});

app.get('/api/products/featured', (req, res) => {
  res.json(mockDb.products);
});

app.get('/api/settings/public', (req, res) => {
  res.json({ success: true, data: mockDb.settings });
});

// Handle all other routes - serve the SPA's index.html
app.get('*', (req, res) => {
  // Handle API 404s
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve index.html from static directory for all other routes (SPA routing)
  const indexPath = path.join(STATIC_PATH, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If index.html doesn't exist, display a helpful message
    res.send(`
      <html>
        <head>
          <title>Desivoo - Setting Up</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #2563eb; }
            pre { background: #f1f1f1; padding: 10px; border-radius: 4px; overflow-x: auto; }
            .status { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px; margin-bottom: 20px; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Desivoo - Server is Running!</h1>
          
          <div class="status">
            <p>✅ Node.js server is running successfully.</p>
            <p>✅ API endpoints are available at /api/...</p>
          </div>
          
          <div class="warning">
            <h3>Frontend Not Found</h3>
            <p>The frontend files are not yet available in the static directory.</p>
          </div>
          
          <h2>Next Steps:</h2>
          <ol>
            <li>Copy your frontend build files to the <code>${STATIC_PATH}</code> directory</li>
            <li>Ensure there's an <code>index.html</code> file in that directory</li>
            <li>Restart the Node.js application from cPanel</li>
          </ol>
          
          <h2>Current Configuration:</h2>
          <pre>
Current Directory: ${__dirname}
Static Path: ${STATIC_PATH}
Uploads Path: ${UPLOADS_PATH}
Node Environment: ${process.env.NODE_ENV}
          </pre>
          
          <h2>API Testing:</h2>
          <ul>
            <li><a href="/api/health">Check API Health</a></li>
            <li><a href="/api/diagnose">View Diagnostics</a></li>
            <li><a href="/api/categories">List Categories</a></li>
          </ul>
        </body>
      </html>
    `);
  }
});

// Export the app for Passenger/cPanel
module.exports = app;

// Start server if this script is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Desivoo server running on port ${PORT}`);
  });
}