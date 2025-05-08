// CommonJS adapter for cPanel deployment
// This file bridges ESM and CommonJS for hosting compatibility

// Set production mode
process.env.NODE_ENV = 'production';

// Import esm-loader helper to load ESM modules in CommonJS
const path = require('path');
const { fileURLToPath } = require('url');
const { createRequire } = require('module');

// Setup dynamic import function
async function importESM(modulePath) {
  return import(modulePath);
}

// Main function to start the server
async function startServer() {
  try {
    // Use the compiled JavaScript server instead of TypeScript
    // On cPanel we can't use TypeScript files directly
    const serverModule = { app: require('./server.js') };
    
    // Get port from environment or use default
    const PORT = process.env.PORT || 3000;
    
    // Use the app or server object from the imported module
    const app = serverModule.app || serverModule.default;
    
    if (!app) {
      console.error('Could not find app export in server module');
      process.exit(1);
    }
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`DesignKorv server started on port ${PORT}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('Gracefully shutting down...');
      server.close(() => {
        console.log('Server shut down');
        process.exit(0);
      });
    });
    
    return app;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this is the main module
if (require.main === module) {
  startServer();
}

// Export for Passenger/cPanel
module.exports = startServer();