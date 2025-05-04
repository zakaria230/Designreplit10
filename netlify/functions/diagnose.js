// Diagnostic function for Netlify deployment
exports.handler = async function(event, context) {
  try {
    // Get environment information (excluding sensitive values)
    const environment = Object.keys(process.env)
      .filter(key => 
        !key.includes('SECRET') && 
        !key.includes('KEY') && 
        !key.includes('TOKEN') && 
        !key.includes('PASSWORD')
      )
      .reduce((obj, key) => {
        obj[key] = process.env[key] ? 'Set' : 'Not set';
        return obj;
      }, {});
    
    // Basic diagnostics
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: environment,
      nodejs: process.version,
      headers: event.headers,
      netlifyInfo: {
        site: process.env.SITE_NAME || 'Not available',
        deployId: process.env.DEPLOY_ID || 'Not available',
        buildId: process.env.BUILD_ID || 'Not available',
      }
    };
    
    // Check if we have database access
    let databaseStatus = 'Not checked';
    try {
      const { db } = require('../../server/db');
      const result = await db.execute('SELECT 1 AS test');
      databaseStatus = result?.rows?.length > 0 ? 'Connected' : 'Failed';
    } catch (dbError) {
      databaseStatus = `Error: ${dbError.message}`;
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'ok',
        message: 'Diagnostic information for DesignKorv deployment',
        diagnostics,
        databaseStatus
      }, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};