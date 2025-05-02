/**
 * Database clearing script for DesignKorv
 * This script drops all tables except for core settings to prepare for clean deployment
 */

import { db, pool } from './server/db.js';
import { users, products, categories, orders, orderItems, carts, reviews, settings } from './shared/schema.js';
import { sql } from 'drizzle-orm';

async function clearDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Drop all tables except for settings
    await db.delete(reviews);
    console.log('✓ Cleared reviews table');
    
    await db.delete(orderItems);
    console.log('✓ Cleared order items table');
    
    await db.delete(orders);
    console.log('✓ Cleared orders table');
    
    await db.delete(carts);
    console.log('✓ Cleared carts table');
    
    await db.delete(products);
    console.log('✓ Cleared products table');
    
    await db.delete(categories);
    console.log('✓ Cleared categories table');
    
    // Do not clear site settings to keep your configuration
    
    // Delete all users except the admin user (user with id=1)
    await db.delete(users).where(sql`id != 1`);
    console.log('✓ Cleared non-admin users');
    
    // Optional: Clear sessions table if exists
    try {
      await db.execute(sql`TRUNCATE TABLE session`);
      console.log('✓ Cleared sessions');
    } catch (err) {
      console.log('Note: Session table not found or could not be cleared.');
    }
    
    console.log('\nDatabase cleanup completed successfully!');
    console.log('Your database is now ready for a fresh deployment, while preserving site settings and admin account.');
    
  } catch (error) {
    console.error('Error during database cleanup:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearDatabase();