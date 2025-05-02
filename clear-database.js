// Script to clear all example/demo data from the database
import { db } from './server/db.js';
import { orders, orderItems, products, categories, carts } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function clearDatabase() {
  console.log('Starting database cleanup...');
  
  try {
    // First remove order items (due to foreign key constraints)
    console.log('Deleting order items...');
    await db.delete(orderItems);
    
    // Then remove orders
    console.log('Deleting orders...');
    await db.delete(orders);
    
    // Clear cart items
    console.log('Clearing cart items...');
    await db.update(carts).set({ items: [] });
    
    // Remove products
    console.log('Deleting products...');
    await db.delete(products);
    
    // Keep categories but empty the table
    console.log('Deleting categories...');
    await db.delete(categories);
    
    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  }
}

clearDatabase();