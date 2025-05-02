import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import Stripe from "stripe";
import { z } from "zod";

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
      res.json(orders);
    } catch (error) {
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
  // Admin Orders
  app.get("/api/admin/orders", isAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/orders/:id", isAdmin, async (req, res) => {
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

  app.patch("/api/admin/orders/:id/status", isAdmin, async (req, res) => {
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

  app.patch("/api/admin/orders/:id/payment", isAdmin, async (req, res) => {
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
  app.post("/api/admin/products", isAdmin, async (req, res) => {
    try {
      const product = req.body;
      const newProduct = await storage.createProduct(product);
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/admin/products/:id", isAdmin, async (req, res) => {
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

  app.delete("/api/admin/products/:id", isAdmin, async (req, res) => {
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

  app.post("/api/admin/categories", isAdmin, async (req, res) => {
    try {
      const category = req.body;
      const newCategory = await storage.createCategory(category);
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
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

  const httpServer = createServer(app);
  return httpServer;
}
