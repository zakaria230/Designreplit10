// Debug function to help diagnose Netlify deployment issues
exports.handler = async function(event, context) {
  try {
    // Get available environment variables (exclude sensitive ones)
    const safeEnvVars = Object.keys(process.env)
      .filter(key => 
        !key.includes('SECRET') && 
        !key.includes('KEY') && 
        !key.includes('TOKEN') && 
        !key.includes('PASSWORD') &&
        !key.includes('AUTH')
      )
      .reduce((obj, key) => {
        obj[key] = process.env[key] ? 'Set' : 'Not set';
        return obj;
      }, {});
    
    // System information
    const systemInfo = {
      nodeVersion: process.version,
      arch: process.arch,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      netlifyInfo: {
        SITE_NAME: process.env.SITE_NAME || 'Not available',
        CONTEXT: process.env.CONTEXT || 'Not available',
        DEPLOY_ID: process.env.DEPLOY_ID || 'Not available',
        BUILD_ID: process.env.BUILD_ID || 'Not available',
        DEPLOY_URL: process.env.DEPLOY_URL || 'Not available',
      }
    };
    
    // Request information
    const requestInfo = {
      method: event.httpMethod,
      path: event.path,
      queryParams: event.queryStringParameters || {},
      headers: event.headers,
      timestamp: new Date().toISOString()
    };
    
    // Try to access filesystem
    let filesystemInfo = 'Not checked';
    try {
      const fs = require('fs');
      const path = require('path');
      
      const functionsDirFiles = fs.readdirSync('.').join(', ');
      const rootDirFiles = fs.readdirSync('..').join(', ');
      
      filesystemInfo = {
        currentDirectory: process.cwd(),
        functionsDir: functionsDirFiles,
        rootDir: rootDirFiles,
      };
    } catch (fsError) {
      filesystemInfo = `Error: ${fsError.message}`;
    }
    
    // Generate HTML report
    if (event.queryStringParameters && event.queryStringParameters.format === 'html') {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>DesignKorv Deployment Debug</title>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 20px; max-width: 1200px; margin: 0 auto; }
            h1 { color: #333; }
            h2 { color: #555; margin-top: 30px; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
            .card { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>DesignKorv Debug Information</h1>
          
          <div class="card">
            <h2>System Information</h2>
            <pre>${JSON.stringify(systemInfo, null, 2)}</pre>
          </div>
          
          <div class="card">
            <h2>Environment Variables</h2>
            <pre>${JSON.stringify(safeEnvVars, null, 2)}</pre>
          </div>
          
          <div class="card">
            <h2>Request Information</h2>
            <pre>${JSON.stringify(requestInfo, null, 2)}</pre>
          </div>
          
          <div class="card">
            <h2>Filesystem Information</h2>
            <pre>${JSON.stringify(filesystemInfo, null, 2)}</pre>
          </div>
          
          <div class="card">
            <h2>Next Steps</h2>
            <ul>
              <li><a href="/">Go to homepage</a></li>
              <li><a href="/api/user">Test API endpoint</a></li>
              <li><a href="/diagnose">Run diagnostics</a></li>
              <li><a href="/fallback">View fallback page</a></li>
            </ul>
          </div>
        </body>
        </html>
      `;
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: htmlContent
      };
    }
    
    // JSON response (default)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'ok',
        message: 'Debug information for DesignKorv deployment',
        systemInfo,
        environment: safeEnvVars,
        request: requestInfo,
        filesystem: filesystemInfo
      }, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};