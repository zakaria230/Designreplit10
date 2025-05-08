// Simple Express web server for cPanel
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Simple middleware for parsing JSON
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DesignKorv API is running' });
});

// Static files
if (fs.existsSync(path.join(__dirname, 'dist/client'))) {
  app.use(express.static(path.join(__dirname, 'dist/client')));
}

// Static uploads
if (fs.existsSync(path.join(__dirname, 'uploads'))) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// All other routes serve the index.html file
app.get('*', (req, res) => {
  // If it's an API request, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Check for index.html in dist/client
  const indexPath = path.join(__dirname, 'dist/client/index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  // Fallback page
  res.send(`
    <html>
      <head><title>DesignKorv</title></head>
      <body>
        <h1>DesignKorv</h1>
        <p>Website is running but client files not found.</p>
        <p>Check <a href="/api/health">API Health</a></p>
      </body>
    </html>
  `);
});

// If this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Passenger
module.exports = app;