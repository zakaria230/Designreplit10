// Netlify serverless function to handle API requests for DesignKorv
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
