import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import Stripe from "stripe";
import { z } from "zod";
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';

// Check for Stripe API key with more descriptive warning
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set. Stripe payment functionality will be disabled.');
  console.warn('You can still use the simulated checkout flow, but real payment processing will not work.');
}

// Initialize Stripe with a more robust approach for production environments
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
      apiVersion: "2023-10-16",
      // Useful for debugging issues in production
      telemetry: false,
    });
    console.log("Stripe payment processing initialized successfully");
  }
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create upload directories if they don't exist
  const uploadDir = path.join(process.cwd(), 'uploads');
  const productImagesDir = path.join(uploadDir, 'products');
  const downloadFilesDir = path.join(uploadDir, 'downloads');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
  if (!fs.existsSync(productImagesDir)) {
    fs.mkdirSync(productImagesDir);
  }
  if (!fs.existsSync(downloadFilesDir)) {
    fs.mkdirSync(downloadFilesDir);
  }
  
  // Setup file upload middleware
  app.use(fileUpload({
    createParentPath: true,
    limits: { 
      fileSize: 50 * 1024 * 1024 // 50MB max file size
    },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: path.join(process.cwd(), 'tmp'),
  }));
  
  // Serve static files from the uploads directory
  app.use('/uploads', (req, res, next) => {
    // Basic security check to prevent directory traversal
    if (req.url.includes('..')) {
      return res.status(403).send('Forbidden');
    }
    next();
  }, (req, res, next) => {
    // Only allow specific file types
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.zip', '.pdf'];
    const ext = path.extname(req.url).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return res.status(403).send('Forbidden file type');
    }
    next();
  }, (req: any, res: any, next: any) => {
    express.static(uploadDir)(req, res, next);
  });
  
  // Setup authentication routes
  setupAuth(app);

  // API routes
  
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/categories/:id/products", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const products = await storage.getProductsByCategory(categoryId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category products" });
    }
  });
  
  app.get("/api/products/category/:id", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const products = await storage.getProductsByCategory(categoryId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category products" });
    }
  });

  // Protected routes middleware
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Admin access required" });
  };
  
  // Middleware to check if user is admin or designer
  const isAdminOrDesigner = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === "admin" || req.user.role === "designer")) {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Admin or Designer access required" });
  };

  // Cart
  app.get("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const cart = await storage.getCartByUser(req.user.id);
      res.json(cart || { userId: req.user.id, items: [] });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid cart items" });
      }
      
      const cart = await storage.createOrUpdateCart(req.user.id, items);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart" });
    }
  });

  // Orders
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user.id);
      
      // Fetch order items for each order and add them to the response
      const ordersWithItems = await Promise.all(orders.map(async (order) => {
        const items = await storage.getOrderItemsByOrder(order.id);
        
        // Fetch product details for each item
        const itemsWithProducts = await Promise.all(items.map(async (item) => {
          const product = await storage.getProductById(item.productId);
          return {
            ...item,
            product
          };
        }));
        
        return {
          ...order,
          items: itemsWithProducts
        };
      }));
      
      res.json(ordersWithItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Create order (simulated checkout when Stripe is not available)
  app.post("/api/create-order", isAuthenticated, async (req, res) => {
    try {
      const { items, totalAmount, paymentStatus = "paid" } = req.body;

      if (!items || !Array.isArray(items) || !totalAmount) {
        return res.status(400).json({ message: "Invalid order data" });
      }

      // Create the order
      const order = await storage.createOrder({
        userId: req.user.id,
        totalAmount,
        status: "processing", // Since this is a simulated direct payment
        paymentStatus,
        paymentIntentId: `sim_${Date.now()}` // Simulated payment intent ID
      });

      // Add order items
      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        });
      }

      res.status(201).json(order);
    } catch (error: any) {
      console.error("Order creation error:", error);
      res.status(500).json({ message: `Failed to create order: ${error.message}` });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Only allow users to see their own orders or admins to see any order
      if (order.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const items = await storage.getOrderItemsByOrder(orderId);
      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Database seeding (development only)
  app.post("/api/dev/seed", async (req, res) => {
    try {
      const seed = require("./seed").default;
      await seed();
      res.status(200).json({ message: "Database seeded successfully" });
    } catch (error: any) {
      res.status(500).json({ message: `Error seeding database: ${error.message}` });
    }
  });

  // Admin routes
  // Admin Users Endpoint
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Return empty users array
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin Stats
  app.get("/api/admin/stats", isAdminOrDesigner, async (req, res) => {
    try {
      // Return zeroed-out stats data
      const stats = {
        totalRevenue: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        recentOrders: [],
        salesData: [],
        categoryData: [],
        orderStatusData: []
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin Orders
  app.get("/api/admin/orders", isAdminOrDesigner, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/orders/:id", isAdminOrDesigner, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const items = await storage.getOrderItemsByOrder(orderId);
      const user = await storage.getUser(order.userId);
      
      res.json({ ...order, items, user });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  app.patch("/api/admin/orders/:id/status", isAdminOrDesigner, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const order = await storage.updateOrderStatus(orderId, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.patch("/api/admin/orders/:id/payment", isAdminOrDesigner, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { paymentStatus } = req.body;
      if (!paymentStatus) {
        return res.status(400).json({ message: "Payment status is required" });
      }
      
      const order = await storage.updatePaymentStatus(orderId, paymentStatus);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Admin Products
  app.post("/api/admin/products", isAdminOrDesigner, async (req, res) => {
    try {
      const product = req.body;
      const newProduct = await storage.createProduct(product);
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/admin/products/:id", isAdminOrDesigner, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = req.body;
      const updatedProduct = await storage.updateProduct(productId, product);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  
  // File upload endpoints
  app.post('/api/admin/upload/product-image', isAdminOrDesigner, async (req: any, res) => {
    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const file = req.files.file;
      const fileName = `${Date.now()}-${file.name}`;
      const uploadPath = path.join(process.cwd(), 'uploads/products', fileName);
      
      // Validate file type
      const fileExt = path.extname(file.name).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
      if (!allowedExtensions.includes(fileExt)) {
        return res.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
      }
      
      // Move the file to upload directory
      file.mv(uploadPath, (err: any) => {
        if (err) {
          console.error('File upload error:', err);
          return res.status(500).json({ message: 'Error uploading file' });
        }
        
        // Return the file path relative to the uploads directory
        res.json({ 
          url: `/uploads/products/${fileName}`,
          message: 'File uploaded successfully' 
        });
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ message: `Failed to upload image: ${error.message}` });
    }
  });
  
  app.post('/api/admin/upload/product-file', isAdminOrDesigner, async (req: any, res) => {
    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const file = req.files.file;
      const fileName = `${Date.now()}-${file.name}`;
      const uploadPath = path.join(process.cwd(), 'uploads/downloads', fileName);
      
      // Validate file type
      const fileExt = path.extname(file.name).toLowerCase();
      const allowedExtensions = ['.zip', '.pdf', '.ai', '.psd', '.eps', '.svg'];
      if (!allowedExtensions.includes(fileExt)) {
        return res.status(400).json({ 
          message: 'Invalid file type. Only zip, pdf, ai, psd, eps, and svg files are allowed.' 
        });
      }
      
      // Move the file to upload directory
      file.mv(uploadPath, (err: any) => {
        if (err) {
          console.error('File upload error:', err);
          return res.status(500).json({ message: 'Error uploading file' });
        }
        
        // Return the file path relative to the uploads directory
        res.json({ 
          url: `/uploads/downloads/${fileName}`,
          message: 'File uploaded successfully' 
        });
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ message: `Failed to upload file: ${error.message}` });
    }
  });

  app.delete("/api/admin/products/:id", isAdminOrDesigner, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      await storage.deleteProduct(productId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.post("/api/admin/categories", isAdminOrDesigner, async (req, res) => {
    try {
      const category = req.body;
      const newCategory = await storage.createCategory(category);
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", isAdminOrDesigner, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = req.body;
      const updatedCategory = await storage.updateCategory(categoryId, category);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(200).json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", isAdminOrDesigner, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const success = await storage.deleteCategory(categoryId);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Stripe integration
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const { amount, items } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Create a PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user.id.toString(),
        },
      });

      // Create order with pending status
      const order = await storage.createOrder({
        userId: req.user.id,
        totalAmount: amount,
        status: "pending",
        paymentIntentId: paymentIntent.id,
        paymentStatus: "pending",
      });

      // Add order items
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          });
        }
      }

      // Return the client secret and order info
      res.json({
        clientSecret: paymentIntent.client_secret,
        orderId: order.id,
      });
    } catch (error: any) {
      res.status(500).json({
        message: `Error creating payment intent: ${error.message}`,
      });
    }
  });

  app.post("/api/webhook", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // Verify webhook signature using the signing secret
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        return res.status(500).json({ message: "Webhook secret not configured" });
      }

      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        webhookSecret
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const { id, metadata } = paymentIntent;

      // Find the order by payment intent ID
      const order = await storage.updatePaymentStatus(
        parseInt(metadata.orderId),
        "paid",
        id
      );

      if (order) {
        await storage.updateOrderStatus(order.id, "processing");
      }
    }

    res.status(200).json({ received: true });
  });

  // Admin Analytics Endpoint
  app.get("/api/admin/analytics", isAdminOrDesigner, async (req, res) => {
    try {
      // Return zeroed-out analytics data
      res.json({
        salesSummary: {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          conversionRate: 0,
        },
        trafficSummary: {
          totalVisitors: 0,
          newUsers: 0,
          returningUsers: 0,
          averageSessionDuration: "0m 0s",
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // Admin Settings Routes
  // Site Settings
  app.post("/api/admin/settings/site", isAdmin, async (req, res) => {
    try {
      // In a real app, you would save these settings to the database
      // For now, we'll just echo back the data to simulate success
      res.json({
        success: true,
        message: "Site settings updated successfully",
        data: req.body
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to update site settings" 
      });
    }
  });

  // Analytics Settings
  app.post("/api/admin/settings/analytics", isAdmin, async (req, res) => {
    try {
      // Simulate successful update
      res.json({
        success: true,
        message: "Analytics settings updated successfully",
        data: req.body
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to update analytics settings" 
      });
    }
  });

  // Email Settings
  app.post("/api/admin/settings/email", isAdmin, async (req, res) => {
    try {
      // Simulate successful update
      res.json({
        success: true,
        message: "Email settings updated successfully",
        data: req.body
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to update email settings" 
      });
    }
  });

  // Social Media Settings
  app.post("/api/admin/settings/social", isAdmin, async (req, res) => {
    try {
      // Simulate successful update
      res.json({
        success: true,
        message: "Social media settings updated successfully",
        data: req.body
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to update social media settings" 
      });
    }
  });

  // Payment Settings
  app.post("/api/admin/settings/payment", isAdmin, async (req, res) => {
    try {
      // In a production app, we would:
      // 1. Validate the payment provider credentials
      // 2. Store them securely (potentially encrypted)
      // 3. Update environment variables if needed
      
      // For now, simulate successful update
      res.json({
        success: true,
        message: "Payment settings updated successfully",
        data: {
          ...req.body,
          // Don't return sensitive info back to client
          stripeSecretKey: req.body.stripeSecretKey ? "********" : "",
          stripeWebhookSecret: req.body.stripeWebhookSecret ? "********" : "",
          paypalClientSecret: req.body.paypalClientSecret ? "********" : "",
          payoneerApiKey: req.body.payoneerApiKey ? "********" : "",
          payoneerPassword: req.body.payoneerPassword ? "********" : ""
        }
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to update payment settings" 
      });
    }
  });

  // Newsletter subscription endpoint
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
      
      // TODO: Implement newsletter subscription logic here
      // This could involve saving to a database or integrating with a marketing service
      
      // For now, just return success
      console.log(`Newsletter subscription request for: ${email}`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      res.status(500).json({ error: 'Failed to subscribe to newsletter' });
    }
  });

  // Reviews API routes
  app.get("/api/reviews/product/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const reviews = await storage.getReviewsByProduct(productId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  
  app.get("/api/reviews/user", isAuthenticated, async (req, res) => {
    try {
      const reviews = await storage.getReviewsByUser(req.user.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  
  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const { productId, rating, title, comment } = req.body;
      
      // Validate required fields
      if (!productId || !rating) {
        return res.status(400).json({ message: "Product ID and rating are required" });
      }
      
      // Check if product exists
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if user already reviewed this product
      const existingReviews = await storage.getReviewsByProduct(productId);
      const userReview = existingReviews.find(review => review.userId === req.user.id);
      
      if (userReview) {
        return res.status(400).json({ 
          message: "You have already reviewed this product",
          reviewId: userReview.id
        });
      }
      
      // Create review
      const review = await storage.createReview({
        userId: req.user.id,
        productId,
        rating,
        title: title || "",
        comment: comment || "",
      });
      
      res.status(201).json(review);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to create review: ${error.message}` });
    }
  });
  
  app.put("/api/reviews/:id", isAuthenticated, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      // Check if review exists
      const review = await storage.getReviewById(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      // Check if user owns this review
      if (review.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only edit your own reviews" });
      }
      
      // Update review
      const { rating, title, comment } = req.body;
      const updatedReview = await storage.updateReview(reviewId, {
        rating,
        title,
        comment,
      });
      
      res.json(updatedReview);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to update review: ${error.message}` });
    }
  });
  
  // Add PATCH endpoint (same as PUT but for partial updates)
  app.patch("/api/reviews/:id", isAuthenticated, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      // Check if review exists
      const review = await storage.getReviewById(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      // Check if user owns this review
      if (review.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only edit your own reviews" });
      }
      
      // Update review
      const { rating, title, comment } = req.body;
      const updatedReview = await storage.updateReview(reviewId, {
        rating,
        title,
        comment,
      });
      
      res.json(updatedReview);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to update review: ${error.message}` });
    }
  });
  
  app.delete("/api/reviews/:id", isAuthenticated, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      // Check if review exists
      const review = await storage.getReviewById(reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      // Check if user owns this review or is admin
      if (review.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You can only delete your own reviews" });
      }
      
      // Delete review
      await storage.deleteReview(reviewId);
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: `Failed to delete review: ${error.message}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
