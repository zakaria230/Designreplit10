/**
 * netlify-build.js
 * Simple build script for Netlify deployment
 */

const fs = require('fs');
const path = require('path');

console.log('Starting Netlify build preparation...');

// Create directory if it doesn't exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Create a redirects file
function createRedirectsFile() {
  const redirectsContent = `# Netlify redirects
/api/*  /.netlify/functions/api/:splat  200
/*      /index.html                     200
`;
  
  // Make sure the directory exists
  ensureDirectoryExists('dist/client');
  
  // Write the file
  fs.writeFileSync('dist/client/_redirects', redirectsContent);
  console.log('Created _redirects file');
}

// Create a simple API function
function createApiFunction() {
  // Ensure the functions directory exists
  ensureDirectoryExists('netlify/functions');
  
  // Create a simple API function
  const apiFunctionContent = `// Simple API function
const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports.handler = serverless(app);
`;
  
  fs.writeFileSync('netlify/functions/api.js', apiFunctionContent);
  console.log('Created API function');
}

// Main function
function main() {
  try {
    // Step 1: Create redirects file
    createRedirectsFile();
    
    // Step 2: Create API function
    createApiFunction();
    
    // Step 3: Create a simple index.html if it doesn't exist in the build directory
    if (!fs.existsSync('dist/client/index.html')) {
      const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DesignKorv</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
      
      fs.writeFileSync('dist/client/index.html', indexContent);
      console.log('Created fallback index.html');
    }
    
    console.log('Netlify build preparation completed successfully!');
  } catch (error) {
    console.error('Error during build preparation:', error);
    process.exit(1);
  }
}

// Run the main function
main();
