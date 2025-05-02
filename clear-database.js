// Script to clear all example/demo data from the database
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.ts';
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

// Only run if explicitly executed, not if imported
if (process.argv[1].endsWith('clear-database.js')) {
  console.log('\x1b[31m%s\x1b[0m', '⚠️  WARNING: This will delete ALL data from the database! ⚠️');
  console.log('\x1b[31m%s\x1b[0m', 'This action is intended to prepare the database for deployment.');
  console.log('\x1b[31m%s\x1b[0m', 'All products, orders, categories and cart items will be removed.');
  console.log('\x1b[33m%s\x1b[0m', '\nTo proceed, run this script with the --confirm flag:');
  console.log('\x1b[33m%s\x1b[0m', 'npx tsx clear-database.js --confirm');
  
  if (process.argv.includes('--confirm')) {
    console.log('\x1b[36m%s\x1b[0m', '\nProceeding with database cleanup...');
    clearDatabase();
  } else {
    console.log('\x1b[31m%s\x1b[0m', '\nOperation aborted. No data was deleted.');
  }
}