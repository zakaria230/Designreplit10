// Minimal server for cPanel troubleshooting
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());

// Simple hello world endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DesignKorv API is running (minimal server)' });
});

// Simple diagnostic endpoint
app.get('/diagnose', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Diagnostic endpoint is working',
    environment: process.env.NODE_ENV || 'not set',
    currentDir: __dirname
  });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API not found' });
  }
  
  res.status(200).send(`
    <html>
      <head><title>DesignKorv Minimal Server</title></head>
      <body>
        <h1>DesignKorv Minimal Server is Running</h1>
        <p>This is a minimal server for troubleshooting.</p>
        <p>Current directory: ${__dirname}</p>
        <p><a href="/diagnose">View diagnostics</a></p>
        <p><a href="/api/health">Check API health</a></p>
      </body>
    </html>
  `);
});

// Start server if direct execution
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Minimal server running on port ${PORT}`);
  });
}

// Export for cPanel/Passenger
module.exports = app;