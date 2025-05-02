import { db } from "./db";
import { categories, products, users } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("🌱 Starting database seeding...");

  // Check if admin user exists
  const adminExists = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, "admin")
  });

  if (!adminExists) {
    console.log("Creating admin user...");
    const hashedPassword = await hashPassword("admin123");
    
    await db.insert(users).values({
      username: "admin",
      email: "admin@designkorv.com",
      password: hashedPassword,
      role: "admin"
    });
    
    console.log("Admin user created");
  } else {
    console.log("Admin user already exists, skipping...");
  }

  // Check if categories exist
  const existingCategories = await db.query.categories.findMany();
  
  if (existingCategories.length === 0) {
    console.log("Creating categories...");
    
    await db.insert(categories).values([
      {
        name: "Patterns",
        slug: "patterns",
        description: "Digital pattern files for fashion design",
        imageUrl: "/uploads/categories/patterns.jpg"
      },
      {
        name: "Technical Drawings",
        slug: "technical-drawings",
        description: "Professional technical drawings for garment production",
        imageUrl: "/uploads/categories/technical-drawings.jpg"
      },
      {
        name: "3D Models",
        slug: "3d-models",
        description: "3D garment models for digital fashion design",
        imageUrl: "/uploads/categories/3d-models.jpg"
      },
      {
        name: "Textures",
        slug: "textures",
        description: "High-quality fabric textures for digital design",
        imageUrl: "/uploads/categories/textures.jpg"
      }
    ]);
    
    console.log("Categories created");
  } else {
    console.log(`${existingCategories.length} categories already exist, skipping...`);
  }

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