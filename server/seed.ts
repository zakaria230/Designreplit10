import { db } from "./db";
import { categories, products, users } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("🌱 Starting database seeding...");

  // Check if any admin user exists
  const adminExists = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.role, "admin")
  });

  if (!adminExists) {
    console.log("No admin user found - please create one using the admin panel");
    console.log("You can uncomment the below code to create a default admin user for testing");
    console.log("WARNING: Make sure to change the default admin password in production!");
    
    // Uncomment and modify this code to create an admin user
    /*
    const adminUsername = "admin"; // Change this
    const adminEmail = "admin@example.com"; // Change this
    const adminPassword = "change-this-password"; // Change this
    
    const hashedPassword = await hashPassword(adminPassword);
    
    await db.insert(users).values({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: "admin"
    });
    
    console.log(`Admin user "${adminUsername}" created - REMEMBER TO CHANGE THE PASSWORD!`);
    */
  } else {
    console.log("Admin user already exists, skipping...");
  }

  // We don't seed example categories for production
  const existingCategories = await db.query.categories.findMany();
  console.log(`${existingCategories.length} categories found in the database`);
  console.log("No sample categories are seeded for production deployment");

  // No example products are seeded for production deployment

  console.log("✅ Database seeding completed successfully");
}

// Run the seed function if this file is executed directly
// For ESM compatibility
if (import.meta.url === import.meta.url) {
  seed()
    .then(() => console.log("✅ Seeding completed successfully"))
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

export default seed;