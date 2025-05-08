// Simple Express server for InMotion
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Basic middleware
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'dist/client')));

// Serve uploaded files
if (fs.existsSync(path.join(__dirname, 'uploads'))) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Simple API endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DesignKorv API is running' });
});

// Serve SPA for any other route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(__dirname, 'dist/client/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for cPanel/InMotion
module.exports = app;
