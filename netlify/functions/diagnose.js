// Diagnostic function to help troubleshoot Netlify deployment issues
exports.handler = async function(event, context) {
  try {
    // Collect system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      env: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString()
    };

    // Collect module information
    const moduleInfo = {
      // Check if critical modules are available
      modulesAvailable: {
        fs: isModuleAvailable('fs'),
        path: isModuleAvailable('path'),
        pg: isModuleAvailable('pg'),
        ws: isModuleAvailable('ws'),
        express: isModuleAvailable('express'),
        drizzle: isModuleAvailable('drizzle-orm')
      }
    };

    // Collect environment information (safely)
    const safeEnvVars = {};
    const criticalEnvVars = [
      'DATABASE_URL', 'NODE_ENV', 'SESSION_SECRET', 
      'STRIPE_SECRET_KEY', 'PAYPAL_CLIENT_ID',
      'PAYPAL_CLIENT_SECRET', 'VITE_STRIPE_PUBLIC_KEY'
    ];
    
    for (const key of criticalEnvVars) {
      // Only check if the variable exists, don't expose actual values
      safeEnvVars[key] = process.env[key] ? 'SET' : 'NOT SET';
    }

    // Try to check disk access
    let fileSystemAccess = 'unknown';
    try {
      const fs = require('fs');
      const files = fs.readdirSync('.');
      fileSystemAccess = {
        status: 'success',
        currentDirectory: process.cwd(),
        fileCount: files.length,
        sampleFiles: files.slice(0, 5).join(', ') + (files.length > 5 ? '...' : '')
      };
    } catch (fsError) {
      fileSystemAccess = {
        status: 'error',
        message: fsError.message
      };
    }

    // Try to check network connectivity
    let networkStatus = 'unknown';
    try {
      const https = require('https');
      const checkPromise = new Promise((resolve, reject) => {
        const req = https.get('https://api.netlify.com/api/v1', (res) => {
          resolve({ status: res.statusCode });
          res.resume();
        });
        
        req.on('error', (err) => {
          reject(err);
        });
        
        // Set a timeout
        req.setTimeout(3000, () => {
          req.abort();
          reject(new Error('Request timeout'));
        });
      });
      
      networkStatus = await checkPromise;
    } catch (netError) {
      networkStatus = {
        status: 'error',
        message: netError.message
      };
    }

    // Format HTML response if requested
    if (event.queryStringParameters && event.queryStringParameters.format === 'html') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html'
        },
        body: generateHtmlReport({
          systemInfo,
          moduleInfo,
          environmentVars: safeEnvVars,
          fileSystemAccess,
          networkStatus
        })
      };
    }

    // Return JSON data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'success',
        message: 'Diagnostic information for DesignKorv deployment',
        system: systemInfo,
        modules: moduleInfo,
        environment: safeEnvVars,
        fileSystem: fileSystemAccess,
        network: networkStatus
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: 'Failed to gather diagnostic information',
        error: error.message
      })
    };
  }
};

// Helper function to check if a module is available
function isModuleAvailable(moduleName) {
  try {
    require.resolve(moduleName);
    return true;
  } catch (e) {
    return false;
  }
}

// Generate an HTML report
function generateHtmlReport(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>DesignKorv Diagnostics</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.5;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #1a365d;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
        }
        h2 {
          color: #2c5282;
          margin-top: 30px;
        }
        .card {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 20px;
        }
        .success {
          color: #22543d;
          background-color: #f0fff4;
          border-left: 4px solid #48bb78;
          padding: 10px 15px;
        }
        .warning {
          color: #744210;
          background-color: #fffff0;
          border-left: 4px solid #ecc94b;
          padding: 10px 15px;
        }
        .error {
          color: #742a2a;
          background-color: #fff5f5;
          border-left: 4px solid #f56565;
          padding: 10px 15px;
        }
        pre {
          background: #f7fafc;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          text-align: left;
          padding: 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background-color: #f7fafc;
        }
        .btn {
          display: inline-block;
          background: #4299e1;
          color: white;
          padding: 8px 16px;
          border-radius: 5px;
          text-decoration: none;
          margin-right: 10px;
          margin-top: 20px;
        }
        .btn:hover {
          background: #3182ce;
        }
      </style>
    </head>
    <body>
      <h1>DesignKorv Deployment Diagnostics</h1>
      
      <div class="card">
        <h2>System Information</h2>
        <pre>${JSON.stringify(data.systemInfo, null, 2)}</pre>
      </div>
      
      <div class="card">
        <h2>Module Availability</h2>
        <table>
          <tr>
            <th>Module</th>
            <th>Available</th>
          </tr>
          ${Object.entries(data.moduleInfo.modulesAvailable).map(([module, available]) => `
            <tr>
              <td>${module}</td>
              <td>${available ? '✅' : '❌'}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      
      <div class="card">
        <h2>Environment Variables</h2>
        <table>
          <tr>
            <th>Variable</th>
            <th>Status</th>
          </tr>
          ${Object.entries(data.environmentVars).map(([variable, status]) => `
            <tr>
              <td>${variable}</td>
              <td class="${status === 'SET' ? 'success' : 'error'}">${status}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      
      <div class="card">
        <h2>File System Access</h2>
        <pre>${JSON.stringify(data.fileSystemAccess, null, 2)}</pre>
      </div>
      
      <div class="card">
        <h2>Network Connectivity</h2>
        <pre>${JSON.stringify(data.networkStatus, null, 2)}</pre>
      </div>
      
      <div class="card">
        <h2>Next Steps</h2>
        <p>Use these diagnostic results to troubleshoot your Netlify deployment:</p>
        <ul>
          <li>Verify all required environment variables are set</li>
          <li>Check database connectivity using the /db-check endpoint</li>
          <li>Examine module availability to ensure all required packages are installed</li>
          <li>Review file system access to ensure Netlify functions can access necessary files</li>
        </ul>
        
        <a href="/" class="btn">Return to Home</a>
        <a href="/db-check" class="btn">Check Database</a>
        <a href="/_debug" class="btn">More Debug Info</a>
      </div>
      
      <p style="margin-top: 40px; color: #718096; text-align: center;">
        DesignKorv Diagnostics • Generated at ${new Date().toISOString()}
      </p>
    </body>
    </html>
  `;
}