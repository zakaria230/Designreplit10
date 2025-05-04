// Database setup helper for Netlify deployments
const { Pool } = require('pg');
const ws = require('ws');

exports.handler = async function(event, context) {
  try {
    // Configure pg to use websockets for Neon database
    if (typeof neonConfig !== 'undefined') {
      neonConfig.webSocketConstructor = ws;
    }
    
    // Attempt to connect to the database
    if (!process.env.DATABASE_URL) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'DATABASE_URL environment variable is not set',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // Try to connect and run a simple query
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Check connection with a simple query
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT current_timestamp as time, current_database() as database');
      const dbInfo = result.rows[0];
      
      // Get schema information
      const tablesQuery = await client.query(`
        SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM 
          information_schema.tables t
        WHERE 
          table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY
          table_name
      `);
      
      // Check if essential tables exist
      const requiredTables = ['users', 'products', 'categories'];
      const missingTables = requiredTables.filter(
        table => !tablesQuery.rows.find(row => row.table_name === table)
      );
      
      await client.release();
      await pool.end();
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'success',
          message: 'Database connection successful',
          timestamp: new Date().toISOString(),
          database: {
            name: dbInfo.database,
            time: dbInfo.time,
            tables: tablesQuery.rows,
            tableCount: tablesQuery.rows.length,
          },
          validation: {
            requiredTables,
            missingTables,
            isValid: missingTables.length === 0
          }
        })
      };
    } catch (queryError) {
      await client.release();
      await pool.end();
      
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Database query failed',
          error: queryError.message,
          timestamp: new Date().toISOString()
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};