// This is a special entry point for cPanel deployment
// It provides compatibility with Passenger app server

// Set production mode
process.env.NODE_ENV = 'production';

// Import the main server
const { app } = require('./dist/server');

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