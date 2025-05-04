// Netlify function to serve static content with diagnostics
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

// Helper function to determine the proper MIME type
function getMimeType(filePath) {
  return mime.lookup(filePath) || 'application/octet-stream';
}

// Helper function to read a file
async function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Helper to check if a file exists
async function fileExistsAsync(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
}

exports.handler = async function(event, context) {
  try {
    // Extract the path from the URL
    const requestPath = event.path.replace('/.netlify/functions/server', '') || '/';
    const sanitizedPath = requestPath.replace(/\.\./g, '').replace(/\/+/g, '/');
    
    // Determine the base directory for static files
    const baseDir = path.join(__dirname, '../../dist/client');
    
    // Full path to the requested file
    let filePath = path.join(baseDir, sanitizedPath === '/' ? 'index.html' : sanitizedPath);
    
    // Check if the file exists
    const fileExists = await fileExistsAsync(filePath);
    
    // If file doesn't exist, serve index.html for client-side routing
    if (!fileExists) {
      // For client-side routing, serve index.html for non-file paths
      if (!path.extname(filePath)) {
        filePath = path.join(baseDir, 'index.html');
      } else {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'text/plain' },
          body: `File not found: ${sanitizedPath}`
        };
      }
    }
    
    // Read the file
    const fileContent = await readFileAsync(filePath);
    
    // Determine content type
    const contentType = getMimeType(filePath);
    
    // Special handling for HTML files - inject diagnostic info for troubleshooting
    if (contentType === 'text/html') {
      // Add custom diagnostic headers
      const headers = {
        'Content-Type': contentType,
        'X-Netlify-Diagnostics': 'true',
        'X-Custom-Path': sanitizedPath,
        'X-File-Path': filePath.replace(baseDir, ''),
        'X-Netlify-Build-ID': process.env.BUILD_ID || 'unknown'
      };
      
      // Serve the file
      return {
        statusCode: 200,
        headers,
        body: fileContent.toString('utf-8')
      };
    }
    
    // For non-HTML files, serve as is
    return {
      statusCode: 200,
      headers: { 'Content-Type': contentType },
      body: contentType.startsWith('text/') 
        ? fileContent.toString('utf-8') 
        : fileContent.toString('base64'),
      isBase64Encoded: !contentType.startsWith('text/')
    };
  } catch (error) {
    console.error('Error serving file:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};