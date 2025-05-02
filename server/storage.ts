import { 
  users, User, InsertUser, 
  products, Product, InsertProduct,
  categories, Category, InsertCategory,
  orders, Order, InsertOrder,
  orderItems, OrderItem, InsertOrderItem,
  carts, Cart, InsertCart,
  reviews, Review, InsertReview,
  settings, Settings, InsertSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Initialize PostgreSQL session store with proper type assertion
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Order methods
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updatePaymentStatus(id: number, paymentStatus: string, paymentIntentId?: string): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order items methods
  getOrderItemsByOrder(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Cart methods
  getCartByUser(userId: number): Promise<Cart | undefined>;
  createOrUpdateCart(userId: number, items: any[]): Promise<Cart>;

  // Review methods
  getReviewsByProduct(productId: number): Promise<Review[]>;
  getReviewsByUser(userId: number): Promise<Review[]>;
  getReviewById(id: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  updateProductRatingAndCount(productId: number): Promise<Product | undefined>;
  
  // Settings methods
  getSetting(key: string): Promise<any>;
  getSettingsByCategory(category: string): Promise<Record<string, any>>;
  updateSetting(key: string, value: any, category: string): Promise<boolean>;
  getAllSettings(): Promise<Record<string, any>>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Type assertion to satisfy the SessionStore interface
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    }) as session.Store;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.isFeatured, true)).limit(8);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));
    return true;
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db
      .delete(categories)
      .where(eq(categories.id, id));
    return true;
  }

  // Order methods
  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getAllOrders(): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updatePaymentStatus(id: number, paymentStatus: string, paymentIntentId?: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ paymentStatus, ...(paymentIntentId ? { paymentIntentId } : {}) })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    // First delete related order items
    await db
      .delete(orderItems)
      .where(eq(orderItems.orderId, id));
      
    // Then delete the order itself
    await db
      .delete(orders)
      .where(eq(orders.id, id));
      
    return true;
  }

  // Order items methods
  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
    return db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db
      .insert(orderItems)
      .values(orderItem)
      .returning();
    return newOrderItem;
  }

  // Cart methods
  async getCartByUser(userId: number): Promise<Cart | undefined> {
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId));
    return cart;
  }

  async createOrUpdateCart(userId: number, items: any[]): Promise<Cart> {
    const existingCart = await this.getCartByUser(userId);

    if (existingCart) {
      const [updatedCart] = await db
        .update(carts)
        .set({ items, updatedAt: new Date() })
        .where(eq(carts.userId, userId))
        .returning();
      return updatedCart;
    } else {
      const [newCart] = await db
        .insert(carts)
        .values({ userId, items })
        .returning();
      return newCart;
    }
  }

  // Review methods
  async getReviewsByProduct(productId: number): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewsByUser(userId: number): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewById(id: number): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id));
    return review;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    
    // Update product rating and review count
    await this.updateProductRatingAndCount(review.productId);
    
    return newReview;
  }

  async updateReview(id: number, review: Partial<InsertReview>): Promise<Review | undefined> {
    const [updatedReview] = await db
      .update(reviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    
    if (updatedReview && review.rating) {
      // Update product rating
      await this.updateProductRatingAndCount(updatedReview.productId);
    }
    
    return updatedReview;
  }

  async deleteReview(id: number): Promise<boolean> {
    const [deletedReview] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id));
    
    await db
      .delete(reviews)
      .where(eq(reviews.id, id));
    
    if (deletedReview) {
      // Update product rating
      await this.updateProductRatingAndCount(deletedReview.productId);
    }
    
    return true;
  }

  async updateProductRatingAndCount(productId: number): Promise<Product | undefined> {
    // Calculate average rating and count
    const result = await db
      .select({
        avgRating: sql`AVG(${reviews.rating})`.as("avgRating"),
        count: sql`COUNT(*)`.as("count")
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));
    
    const avgRating = result[0]?.avgRating || 0;
    const numReviews = result[0]?.count || 0;
    
    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
        rating: avgRating,
        numReviews: numReviews
      })
      .where(eq(products.id, productId))
      .returning();
    
    return updatedProduct;
  }
  
  // Settings methods
  async getSetting(key: string): Promise<any> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    
    if (setting) {
      return setting.value;
    }
    
    return null;
  }
  
  async getSettingsByCategory(category: string): Promise<Record<string, any>> {
    const categorySettings = await db
      .select()
      .from(settings)
      .where(eq(settings.category, category));
    
    const result: Record<string, any> = {};
    
    for (const setting of categorySettings) {
      result[setting.key] = setting.value;
    }
    
    return result;
  }
  
  async updateSetting(key: string, value: any, category: string): Promise<boolean> {
    // Check if setting exists
    const existingSetting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    
    if (existingSetting.length > 0) {
      // Update existing setting
      await db
        .update(settings)
        .set({ 
          value,
          updatedAt: new Date()
        })
        .where(eq(settings.key, key));
    } else {
      // Create new setting
      await db
        .insert(settings)
        .values({
          key,
          value,
          category
        });
    }
    
    return true;
  }
  
  async getAllSettings(): Promise<Record<string, any>> {
    const allSettings = await db.select().from(settings);
    
    // Group settings by category
    const result: Record<string, any> = {};
    
    for (const setting of allSettings) {
      if (!result[setting.category]) {
        result[setting.category] = {};
      }
      
      result[setting.category][setting.key] = setting.value;
    }
    
    return result;
  }
}

export const storage = new DatabaseStorage();
