import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgPoolClient } from 'drizzle-orm/pg.server';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon database if using Neon
if (typeof process.env.DATABASE_URL === 'string' && 
    process.env.DATABASE_URL.includes('neon.tech')) {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  console.error("WARNING: DATABASE_URL is not set. Database functionality will be unavailable.");
  throw new Error(
    "DATABASE_URL must be set. Please configure your database connection.",
  );
}

// Create database connection pool
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Allow overriding SSL settings if needed for different hosting environments
  ssl: process.env.DB_SSL_MODE === 'disable' ? false : {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  },
});

// Export the database client
export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
