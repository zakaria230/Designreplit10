// Simple API function for Netlify
const express = require('express');
const serverless = require('serverless-http');
const app = express();

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'DesignKorv API is working!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export the serverless handler
module.exports.handler = serverless(app);
