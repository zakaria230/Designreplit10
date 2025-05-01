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
        imageUrl: "https://images.unsplash.com/photo-1589891685388-487406e4e5d5?q=80&w=2940&auto=format&fit=crop"
      },
      {
        name: "Technical Drawings",
        slug: "technical-drawings",
        description: "Professional technical drawings for garment production",
        imageUrl: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=2940&auto=format&fit=crop"
      },
      {
        name: "3D Models",
        slug: "3d-models",
        description: "3D garment models for digital fashion design",
        imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2964&auto=format&fit=crop"
      },
      {
        name: "Textures",
        slug: "textures",
        description: "High-quality fabric textures for digital design",
        imageUrl: "https://images.unsplash.com/photo-1579643191658-3a9f557cb867?q=80&w=2873&auto=format&fit=crop"
      }
    ]);
    
    console.log("Categories created");
  } else {
    console.log(`${existingCategories.length} categories already exist, skipping...`);
  }

  // Fetch categories to get their IDs
  const categoryList = await db.query.categories.findMany();
  const categoryMap = new Map(categoryList.map(cat => [cat.slug, cat.id]));

  // Check if products exist
  const existingProducts = await db.query.products.findMany();
  
  if (existingProducts.length === 0) {
    console.log("Creating products...");
    
    const productsToInsert = [
      {
        name: "Basic Pattern Block Set",
        slug: "basic-pattern-block-set",
        description: "A comprehensive set of basic pattern blocks for bodice, skirt, sleeve, and pants. Perfect for pattern drafting and design development.",
        price: 39.99,
        imageUrl: "https://images.unsplash.com/photo-1558705232-23dda1d91495?q=80&w=2940&auto=format&fit=crop",
        downloadUrl: "https://example.com/files/basic-pattern-block-set.zip",
        categoryId: categoryMap.get("patterns"),
        isFeatured: true,
        rating: 4.8,
        numReviews: 32
      },
      {
        name: "Evening Dress Technical Pack",
        slug: "evening-dress-technical-pack",
        description: "Complete technical package for an evening dress design including tech flats, construction details, and measurement specifications.",
        price: 59.99,
        imageUrl: "https://images.unsplash.com/photo-1564499504739-a2c3435e7fe1?q=80&w=2787&auto=format&fit=crop",
        downloadUrl: "https://example.com/files/evening-dress-tech-pack.zip",
        categoryId: categoryMap.get("technical-drawings"),
        isFeatured: true,
        rating: 4.9,
        numReviews: 24
      },
      {
        name: "Coat 3D Model Bundle",
        slug: "coat-3d-model-bundle",
        description: "3D models of various coat designs with draping simulation capabilities. Suitable for 3D fashion design software.",
        price: 89.99,
        imageUrl: "https://images.unsplash.com/photo-1544923408-75c5cef46f14?q=80&w=2787&auto=format&fit=crop",
        downloadUrl: "https://example.com/files/coat-3d-model-bundle.zip",
        categoryId: categoryMap.get("3d-models"),
        isFeatured: true,
        rating: 4.7,
        numReviews: 18
      },
      {
        name: "Premium Fabric Texture Collection",
        slug: "premium-fabric-texture-collection",
        description: "Ultra high-resolution fabric textures including silk, wool, cotton, and synthetic materials with normal and bump maps.",
        price: 49.99,
        imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=2015&auto=format&fit=crop",
        downloadUrl: "https://example.com/files/premium-fabric-textures.zip",
        categoryId: categoryMap.get("textures"),
        isFeatured: true,
        rating: 4.6,
        numReviews: 41
      },
      {
        name: "Sportswear Pattern Collection",
        slug: "sportswear-pattern-collection",
        description: "Specialized pattern collection for athletic wear including leggings, sports bras, jackets, and tops with stretch fabric considerations.",
        price: 69.99,
        imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=2940&auto=format&fit=crop",
        downloadUrl: "https://example.com/files/sportswear-patterns.zip",
        categoryId: categoryMap.get("patterns"),
        isFeatured: false,
        rating: 4.5,
        numReviews: 27
      },
      {
        name: "Technical Drawing Template Library",
        slug: "technical-drawing-template-library",
        description: "A comprehensive library of vector-based technical drawing templates for various garment types with customizable details.",
        price: 45.99,
        imageUrl: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?q=80&w=2940&auto=format&fit=crop",
        downloadUrl: "https://example.com/files/tech-drawing-templates.zip",
        categoryId: categoryMap.get("technical-drawings"),
        isFeatured: false,
        rating: 4.4,
        numReviews: 19
      },
      {
        name: "Denim Collection 3D Models",
        slug: "denim-collection-3d-models",
        description: "Detailed 3D models of denim garments with realistic stitching, fabric properties, and wash variations.",
        price: 79.99,
        imageUrl: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?q=80&w=2940&auto=format&fit=crop",
        downloadUrl: "https://example.com/files/denim-3d-models.zip",
        categoryId: categoryMap.get("3d-models"),
        isFeatured: false,
        rating: 4.7,
        numReviews: 14
      },
      {
        name: "Season Trend Textures Pack",
        slug: "season-trend-textures-pack",
        description: "Current season's trending fabric textures with color variations and material properties for digital fashion design.",
        price: 34.99,
        imageUrl: "https://images.unsplash.com/photo-1626000666164-df41e246357a?q=80&w=2787&auto=format&fit=crop",
        downloadUrl: "https://example.com/files/trend-textures-pack.zip",
        categoryId: categoryMap.get("textures"),
        isFeatured: false,
        rating: 4.3,
        numReviews: 22
      },
      {
        name: "Avant-Garde Pattern Collection",
        slug: "avant-garde-pattern-collection",
        description: "Experimental pattern designs for avant-garde fashion pieces with unconventional silhouettes and constructions.",
        price: 99.99,
        imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=2940&auto=format&fit=crop",
        downloadUrl: "https://example.com/files/avant-garde-patterns.zip",
        categoryId: categoryMap.get("patterns"),
        isFeatured: false,
        rating: 4.8,
        numReviews: 9
      },
      {
        name: "Outerwear Technical Specifications",
        slug: "outerwear-technical-specifications",
        description: "Detailed technical specifications for various outerwear types including jackets, coats, and vests with construction details.",
        price: 54.99,
        imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=2736&auto=format&fit=crop",
        downloadUrl: "https://example.com/files/outerwear-tech-specs.zip",
        categoryId: categoryMap.get("technical-drawings"),
        isFeatured: false,
        rating: 4.5,
        numReviews: 16
      }
    ];
    
    for (const product of productsToInsert) {
      await db.insert(products).values(product);
    }
    
    console.log("Products created");
  } else {
    console.log(`${existingProducts.length} products already exist, skipping...`);
  }

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