// This is a special entry point for cPanel deployment
// It provides compatibility with Passenger app server

// Set production mode
process.env.NODE_ENV = 'production';

// Create and configure Express app for direct use
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check available paths (for diagnostics)
console.log('Current directory:', __dirname);
console.log('Available paths:', fs.readdirSync(__dirname).join(', '));

// Try multiple static file locations for maximum compatibility
const possibleClientPaths = [
  path.join(__dirname, 'dist', 'client'),
  path.join(__dirname, 'client'),
  path.join(__dirname, 'public'),
  path.join(__dirname, 'dist')
];

let clientPath = null;
for (const dir of possibleClientPaths) {
  if (fs.existsSync(dir)) {
    console.log(`Found client files at: ${dir}`);
    clientPath = dir;
    app.use(express.static(dir));
    break;
  }
}

if (!clientPath) {
  console.error('WARNING: No client files found in any expected directory!');
}

// Serve uploaded files
const uploadPaths = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, '../uploads')
];

let uploadsPath = null;
for (const dir of uploadPaths) {
  if (fs.existsSync(dir)) {
    console.log(`Found uploads at: ${dir}`);
    uploadsPath = dir;
    app.use('/uploads', express.static(dir));
    break;
  }
}

// Add diagnostic endpoint to help troubleshoot issues
app.get('/diagnose', (req, res) => {
  const diagnostics = {
    environment: process.env.NODE_ENV,
    currentDirectory: __dirname,
    directories: {
      current: fs.existsSync(__dirname) ? fs.readdirSync(__dirname) : 'not accessible',
      clientPath: clientPath,
      uploadsPath: uploadsPath,
      clientFiles: clientPath ? fs.readdirSync(clientPath) : 'not found',
      distExists: fs.existsSync(path.join(__dirname, 'dist')),
      distContents: fs.existsSync(path.join(__dirname, 'dist')) ? 
        fs.readdirSync(path.join(__dirname, 'dist')) : 'not found'
    }
  };
  
  res.json(diagnostics);
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DesignKorv API is running' });
});

// Fallback route to serve the SPA for client-side routing
app.get('*', (req, res) => {
  // Check if request is for an API route
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Find and serve index.html from the client path we detected
  if (clientPath) {
    const indexPath = path.join(clientPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  // Fallback to traditional path as a last resort
  const traditionalIndexPath = path.join(__dirname, 'dist', 'client', 'index.html');
  if (fs.existsSync(traditionalIndexPath)) {
    return res.sendFile(traditionalIndexPath);
  }

  // If no index.html is found, provide a helpful error message with diagnostic info
  res.status(404).send(`
    <html>
      <head><title>DesignKorv Diagnostic Page</title></head>
      <body>
        <h1>DesignKorv - Application Files Not Found</h1>
        <p>The application files could not be located. Please ensure that:</p>
        <ol>
          <li>The application has been built (<code>npm run build</code>)</li>
          <li>The dist/client directory has been uploaded to the server</li>
          <li>The server has permission to read these files</li>
        </ol>
        <p>Current directory: ${__dirname}</p>
        <p>Detected client path: ${clientPath || 'None'}</p>
        <p><a href="/diagnose">View detailed diagnostics</a></p>
        <hr>
        <button onclick="window.location.reload()">Refresh Page</button>
      </body>
    </html>
  `);
});

// Get port from environment or use 3000 as fallback
const PORT = process.env.PORT || 3000;

// Start the server if we're the main module
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DesignKorv server started on port ${PORT}`);
  });
}

// Export for Passenger
module.exports = app;