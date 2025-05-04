// Netlify serverless function to initialize the database
const { db } = require('../../server/db');
const { exec } = require('child_process');

exports.handler = async function(event, context) {
  // Basic security check - only allow this from authorized users
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }
  
  // The token should match SESSION_SECRET for basic protection
  const token = authHeader.split(' ')[1];
  if (token !== process.env.SESSION_SECRET) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden' })
    };
  }
  
  try {
    console.log('Starting database initialization...');
    
    // Test database connection
    try {
      // Simple query to test connection
      const result = await db.execute('SELECT NOW()');
      console.log('Database connection successful', result);
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Database connection failed', 
          details: dbError.message,
          connectionString: process.env.DATABASE_URL ? 'DATABASE_URL is set' : 'DATABASE_URL is missing'
        })
      };
    }
    
    // Run drizzle-kit push to set up schema
    console.log('Running database schema migration...');
    try {
      const pushResult = await new Promise((resolve, reject) => {
        exec('npx drizzle-kit push', (error, stdout, stderr) => {
          if (error) {
            console.error('Migration error:', error);
            reject(error);
          } else {
            console.log('Migration output:', stdout);
            if (stderr) console.error('Migration stderr:', stderr);
            resolve(stdout);
          }
        });
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Database initialized successfully',
          details: pushResult
        })
      };
    } catch (migrationError) {
      console.error('Migration execution error:', migrationError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Database migration failed', 
          details: migrationError.message 
        })
      };
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};