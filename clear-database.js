// Script to clear all example/demo data from the database
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.js';
import { eq } from 'drizzle-orm';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function clearDatabase() {
  console.log('Starting database cleanup...');
  
  try {
    // First remove order items (due to foreign key constraints)
    console.log('Deleting order items...');
    await db.delete(schema.orderItems);
    
    // Then remove orders
    console.log('Deleting orders...');
    await db.delete(schema.orders);
    
    // Clear cart items
    console.log('Clearing cart items...');
    await db.update(schema.carts).set({ items: [] });
    
    // Remove products
    console.log('Deleting products...');
    await db.delete(schema.products);
    
    // Keep categories but empty the table
    console.log('Deleting categories...');
    await db.delete(schema.categories);
    
    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    // Close the database connection
    console.log('Closing database connection...');
    await pool.end();
    console.log('Database connection closed.');
  }
}

// Execute the cleanup function
clearDatabase();