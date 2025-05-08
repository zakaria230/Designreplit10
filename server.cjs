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

// Serve static files from the dist/client directory
if (fs.existsSync(path.join(__dirname, 'dist', 'client'))) {
  app.use(express.static(path.join(__dirname, 'dist', 'client')));
}

// Serve uploaded files
if (fs.existsSync(path.join(__dirname, 'uploads'))) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

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
  
  // Serve the index.html for client routes
  if (fs.existsSync(path.join(__dirname, 'dist', 'client', 'index.html'))) {
    res.sendFile(path.join(__dirname, 'dist', 'client', 'index.html'));
  } else {
    res.status(404).send('Application files not found. Please build the client application.');
  }
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