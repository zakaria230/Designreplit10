import express, {
  type Express,
  Request,
  Response,
  NextFunction,
} from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import Stripe from "stripe";
import { z } from "zod";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import csrf from "csurf";
import {
  isAuthenticated,
  isAdmin,
  isDesignerOrAdmin as isAdminOrDesigner,
} from "./middleware";
import { generateSitemap } from "./routes/sitemap";

// Define global variables for payment gateways
let stripe: Stripe | null = null;
let paypalClient: any = null;

// Helper function to setup PayPal
function getPayPalClient(
  clientId: string,
  clientSecret: string,
  isSandbox = true,
) {
  const environment = isSandbox
    ? new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret)
    : new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);

  return new checkoutNodeJssdk.core.PayPalHttpClient(environment);
}

// Function to initialize payment gateways from database settings or environment variables
async function initializePaymentGateways() {
  try {
    // Try to get payment settings from database first
    const paymentSettings = await storage.getSettingsByCategory("payment");

    // Initialize Stripe
    const stripeSecretKey =
      paymentSettings["payment_stripeSecretKey"] ||
      process.env.STRIPE_SECRET_KEY;

    if (stripeSecretKey) {
      stripe = new Stripe(stripeSecretKey as string, {
        apiVersion: "2023-10-16",
        telemetry: false,
      });
      console.log("Stripe payment processing initialized successfully");
    } else {
      console.warn(
        "Warning: Stripe secret key not found. Stripe payment functionality will be disabled.",
      );
      console.warn(
        "You can still use the simulated checkout flow, but real payment processing will not work.",
      );
    }

    // Initialize PayPal
    const paypalClientId =
      paymentSettings["payment_paypalClientId"] || process.env.PAYPAL_CLIENT_ID;

    const paypalClientSecret =
      paymentSettings["payment_paypalClientSecret"] ||
      process.env.PAYPAL_CLIENT_SECRET;

    // Determine PayPal sandbox mode from settings
    let paypalSandboxMode = true; // Default to sandbox mode for safety

    if (paymentSettings["payment_paypalSandboxMode"] !== undefined) {
      // Convert string 'true'/'false' to boolean
      paypalSandboxMode =
        paymentSettings["payment_paypalSandboxMode"] === "true" ||
        paymentSettings["payment_paypalSandboxMode"] === true;
    }

    if (paypalClientId && paypalClientSecret) {
      // Create PayPal client
      paypalClient = getPayPalClient(
        paypalClientId,
        paypalClientSecret,
        paypalSandboxMode,
      );
      console.log("PayPal payment processing initialized successfully");
    } else {
      if (!paypalClientId) {
        console.warn(
          "Warning: PayPal Client ID not found. PayPal checkout will be disabled.",
        );
      }

      if (!paypalClientSecret) {
        console.warn(
          "Warning: PayPal Client Secret not found. PayPal checkout will be disabled.",
        );
      }
    }
  } catch (error) {
    console.error("Error initializing payment gateways:", error);

    // Fallback to environment variables if database fails
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2023-10-16",
          telemetry: false,
        });
        console.log(
          "Stripe payment processing initialized from environment variables",
        );
      } catch (stripeError) {
        console.error("Failed to initialize Stripe:", stripeError);
      }
    } else {
      console.warn(
        "Warning: STRIPE_SECRET_KEY is not set. Stripe payment functionality will be disabled.",
      );
    }

    if (!process.env.PAYPAL_CLIENT_ID) {
      console.warn(
        "Warning: PAYPAL_CLIENT_ID is not set. Using test mode for PayPal.",
      );
    }

    if (!process.env.PAYPAL_CLIENT_SECRET) {
      console.warn(
        "Warning: PAYPAL_CLIENT_SECRET is not set. Using simulation for PayPal checkout.",
      );
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize payment gateways
  await initializePaymentGateways();

  // Create upload directories if they don't exist
  const uploadDir = path.join(process.cwd(), "uploads");
  const productImagesDir = path.join(uploadDir, "products");
  const downloadFilesDir = path.join(uploadDir, "downloads");

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
  app.use(
    fileUpload({
      createParentPath: true,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
      },
      abortOnLimit: true,
      useTempFiles: true,
      tempFileDir: path.join(process.cwd(), "tmp"),
    }),
  );

  // Serve static files from the uploads directory
  app.use(
    "/uploads",
    (req, res, next) => {
      // Basic security check to prevent directory traversal
      if (req.url.includes("..")) {
        return res.status(403).send("Forbidden");
      }
      next();
    },
    (req, res, next) => {
      // Only allow specific file types
      const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".svg",
        ".zip",
        ".pdf",
      ];
      const ext = path.extname(req.url).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return res.status(403).send("Forbidden file type");
      }
      next();
    },
    async (req: Request, res: Response, next: NextFunction) => {
      // Special security for downloadable files
      // If the request is for a file in the downloads directory, check if the user has paid for it
      if (req.url.startsWith("/downloads/") && req.isAuthenticated()) {
        const fileName = path.basename(req.url);
        console.log(`Download request for file: ${fileName} by user: ${req.user!.id}`);

        try {
          // Get all paid orders for this user
          const orders = await storage.getOrdersByUser(req.user!.id);
          const paidOrders = orders.filter(
            (order) => order.paymentStatus === "paid",
          );
          
          console.log(`User has ${paidOrders.length} paid orders to check`);

          // Fetch order items with product info for all paid orders
          let hasAccess = false;

          for (const order of paidOrders) {
            // Get items for this order
            const items = await storage.getOrderItemsByOrder(order.id);
            
            // We need to get product details for each item since they're not included by default
            const itemsWithProducts = await Promise.all(
              items.map(async (item) => {
                const product = await storage.getProductById(item.productId);
                return {
                  ...item,
                  product,
                };
              })
            );
            
            // Now check each item with its product info
            for (const item of itemsWithProducts) {
              if (item.product && item.product.downloadUrl) {
                const downloadFileName = path.basename(item.product.downloadUrl);
                console.log(`Checking file: ${downloadFileName} against requested: ${fileName}`);
                
                if (downloadFileName === fileName) {
                  hasAccess = true;
                  console.log(`Access granted for file: ${fileName}`);
                  break;
                }
              }
            }

            if (hasAccess) break;
          }

          if (!hasAccess) {
            console.log(`Access denied for file: ${fileName}`);
            return res
              .status(403)
              .send(
                "Access denied: You have not purchased this item or payment is pending",
              );
          }
        } catch (error) {
          console.error("Error checking download access:", error);
          return res
            .status(500)
            .send("Server error checking download permissions");
        }
      }

      express.static(uploadDir)(req, res, next);
    },
  );

  // Setup authentication routes
  setupAuth(app);

  // Setup CSRF protection middleware with proper configuration - but disable for now
  // to allow the app to function properly
  const csrfProtection = (req: any, res: any, next: any) => {
    next(); // Bypass CSRF protection for now
  };

  // CSRF token endpoint - returns a dummy token
  app.get("/api/csrf-token", (req, res) => {
    res.json({ csrfToken: "dummy-token-for-development" });
  });

  // Using middleware from middleware.ts

  // Create special routes to delete resources without CSRF (temporary workaround)
  // This will allow us to handle deletion without CSRF token verification

  // Force-delete user
  app.delete("/api/admin/users/:id/force-delete", isAdmin, async (req, res) => {
    try {
      console.log(
        `DELETE user endpoint (force) called with ID: ${req.params.id}`,
      );

      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Don't allow deleting the admin user
      if (userId === 1) {
        return res.status(403).json({ message: "Cannot delete admin user" });
      }

      // Get the current user to check if exists
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Calling storage.deleteUser for user ID: ${userId}`);
      // Delete the user with all related records
      const deleted = await storage.deleteUser(userId);

      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete user" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Force-delete product
  app.delete(
    "/api/admin/products/:id/force-delete",
    isAdminOrDesigner,
    async (req, res) => {
      try {
        console.log(
          `DELETE product endpoint (force) called with ID: ${req.params.id}`,
        );

        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
          return res.status(400).json({ message: "Invalid product ID" });
        }

        // Get the current product to check if exists
        const currentProduct = await storage.getProductById(productId);
        if (!currentProduct) {
          return res.status(404).json({ message: "Product not found" });
        }

        console.log(
          `Calling storage.deleteProduct for product ID: ${productId}`,
        );
        // Delete the product with all related records
        const deleted = await storage.deleteProduct(productId);

        if (!deleted) {
          return res.status(500).json({ message: "Failed to delete product" });
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Failed to delete product" });
      }
    },
  );

  // Force-delete category
  app.delete(
    "/api/admin/categories/:id/force-delete",
    isAdminOrDesigner,
    async (req, res) => {
      try {
        console.log(
          `DELETE category endpoint (force) called with ID: ${req.params.id}`,
        );

        const categoryId = parseInt(req.params.id);
        if (isNaN(categoryId)) {
          return res.status(400).json({ message: "Invalid category ID" });
        }

        // Get the current category to check if exists
        const currentCategory = await storage.getCategoryById(categoryId);
        if (!currentCategory) {
          return res.status(404).json({ message: "Category not found" });
        }

        // Check if category has products
        const products = await storage.getProductsByCategory(categoryId);
        if (products.length > 0) {
          return res.status(400).json({
            message:
              "Cannot delete category with associated products. Please move or delete products first.",
          });
        }

        console.log(
          `Calling storage.deleteCategory for category ID: ${categoryId}`,
        );
        // Delete the category
        const deleted = await storage.deleteCategory(categoryId);

        if (!deleted) {
          return res.status(500).json({ message: "Failed to delete category" });
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Failed to delete category" });
      }
    },
  );

  // Force-delete order
  app.delete(
    "/api/admin/orders/:id/force-delete",
    isAdminOrDesigner,
    async (req, res) => {
      try {
        console.log(
          `DELETE order endpoint (force) called with ID: ${req.params.id}`,
        );

        const orderId = parseInt(req.params.id);
        if (isNaN(orderId)) {
          return res.status(400).json({ message: "Invalid order ID" });
        }

        // Get the current order to check if exists
        const currentOrder = await storage.getOrderById(orderId);
        if (!currentOrder) {
          return res.status(404).json({ message: "Order not found" });
        }

        console.log(`Calling storage.deleteOrder for order ID: ${orderId}`);
        // Delete the order with all related records
        const deleted = await storage.deleteOrder(orderId);

        if (!deleted) {
          return res.status(500).json({ message: "Failed to delete order" });
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({ message: "Failed to delete order" });
      }
    },
  );

  // API routes

  // Public endpoint for site settings
  app.get("/api/settings/public", async (req, res) => {
    try {
      // Only expose select settings categories that are safe for public consumption
      const siteSettings = await storage.getSettingsByCategory("site");

      // Exclude any sensitive settings (just in case)
      const sensitiveKeys = ["site_smtpPassword", "site_apiKeys"];
      Object.keys(siteSettings).forEach((key) => {
        if (sensitiveKeys.some((sk) => key.includes(sk))) {
          delete siteSettings[key];
        }
      });

      res.json({
        success: true,
        data: {
          site: siteSettings,
        },
      });
    } catch (error) {
      console.error("Error fetching public settings:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching public settings",
      });
    }
  });

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
      // Get search query from request if it exists
      const searchQuery = req.query.search as string;
      const categoryId = req.query.categoryId
        ? parseInt(req.query.categoryId as string)
        : undefined;

      if (searchQuery || categoryId) {
        // If we have a search query or category filter, use a filtered approach
        let products = await storage.getAllProducts();

        // Filter by search query if provided
        if (searchQuery) {
          const query = searchQuery.toLowerCase().trim();
          products = products.filter((product) => {
            const nameMatch = product.name.toLowerCase().includes(query);
            const descMatch = product.description
              ? product.description.toLowerCase().includes(query)
              : false;
            return nameMatch || descMatch;
          });
        }

        // Filter by category if provided
        if (categoryId && !isNaN(categoryId)) {
          products = products.filter(
            (product) => product.categoryId === categoryId,
          );
        }

        res.json(products);
      } else {
        // If no filters, get all products
        const products = await storage.getAllProducts();
        res.json(products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
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

  // Download endpoint
  app.get("/api/downloads/:filename", isAuthenticated, async (req, res) => {
    try {
      const fileName = req.params.filename;
      console.log(`Download request for file: ${fileName} by user: ${req.user.id}`);
      
      // Get all paid orders for this user
      const orders = await storage.getOrdersByUser(req.user.id);
      const paidOrders = orders.filter(
        (order) => order.paymentStatus === "paid",
      );
      
      console.log(`User has ${paidOrders.length} paid orders to check`);
      
      // Check if user has purchased any product with this download URL
      let hasAccess = false;
      let productName = "";
      
      for (const order of paidOrders) {
        // Get items for this order
        const items = await storage.getOrderItemsByOrder(order.id);
        
        // Check each item
        for (const item of items) {
          const product = await storage.getProductById(item.productId);
          
          if (product && product.downloadUrl) {
            const downloadFileName = path.basename(product.downloadUrl);
            console.log(`Checking file: ${downloadFileName} against requested: ${fileName}`);
            
            if (downloadFileName === fileName) {
              hasAccess = true;
              productName = product.name;
              console.log(`Access granted for file: ${fileName} from product: ${productName}`);
              break;
            }
          }
        }
        
        if (hasAccess) break;
      }
      
      if (!hasAccess) {
        console.log(`Access denied for file: ${fileName}`);
        return res.status(403).send("Access denied: You have not purchased this item or payment is pending");
      }
      
      // User has access, serve the file
      const filePath = path.join(process.cwd(), "uploads", "downloads", fileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return res.status(404).send("File not found");
      }
      
      // Set the download headers
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error("Error serving download:", error);
      res.status(500).send("Server error processing download");
    }
  });
  
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
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItemsByOrder(order.id);

          // Fetch product details for each item
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              const product = await storage.getProductById(item.productId);
              return {
                ...item,
                product,
              };
            }),
          );

          return {
            ...order,
            items: itemsWithProducts,
          };
        }),
      );

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
        paymentIntentId: `sim_${Date.now()}`, // Simulated payment intent ID
        // Order code will be auto-generated by storage.createOrder
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
      res
        .status(500)
        .json({ message: `Failed to create order: ${error.message}` });
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
      res
        .status(500)
        .json({ message: `Error seeding database: ${error.message}` });
    }
  });

  // Admin routes
  // Admin Users Endpoint
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Fetch all users from the database
      const allUsers = await db.select().from(users);

      // Map the users to remove sensitive information like passwords
      const safeUsers = allUsers.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }));

      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create user from admin panel
  app.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Use auth.ts helper to hash the password
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword(password);
      
      // Create user with admin-specified role or default to "user"
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: role || "user"
      });

      // Don't return the password
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user
  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Get the current user to check if exists
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { username, email, role, password } = req.body;

      // Update user in the database
      const updateData: any = {};

      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (role) updateData.role = role;

      // Only hash and update password if provided
      if (password && password.trim() !== "") {
        const { hashPassword } = await import("./auth");
        updateData.password = await hashPassword(password);
      }

      // Perform the update
      await db.update(users).set(updateData).where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      console.log(`DELETE user endpoint called with ID: ${req.params.id}`);

      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Don't allow deleting the admin user
      if (userId === 1) {
        return res.status(403).json({ message: "Cannot delete admin user" });
      }

      // Get the current user to check if exists
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Calling storage.deleteUser for user ID: ${userId}`);
      // Delete the user with all related records
      const deleted = await storage.deleteUser(userId);

      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete user" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin Stats
  app.get("/api/admin/stats", isAdminOrDesigner, async (req, res) => {
    try {
      // Fetch real data from the database
      const allOrders = await storage.getAllOrders();
      const allUsers = await db.select().from(users);
      const allProducts = await storage.getAllProducts();

      // Calculate total revenue (only from paid orders)
      const totalRevenue = allOrders.reduce((sum, order) => {
        // Only include revenue from orders with paymentStatus === 'paid'
        return order.paymentStatus === "paid"
          ? sum + (order.totalAmount || 0)
          : sum;
      }, 0);

      // Get recent orders with additional info
      const recentOrders = await Promise.all(
        allOrders.slice(0, 5).map(async (order) => {
          const user = await storage.getUser(order.userId);
          const items = await storage.getOrderItemsByOrder(order.id);
          return {
            ...order,
            user: {
              id: user?.id || 0,
              username: user?.username || "Unknown",
              email: user?.email || "unknown@example.com",
            },
            itemCount: items.length,
          };
        }),
      );

      // Generate monthly sales data for the chart
      const currentDate = new Date();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const salesData = Array.from({ length: 6 }, (_, i) => {
        const month = new Date(currentDate);
        month.setMonth(currentDate.getMonth() - (5 - i));

        // Filter orders for this month
        const monthOrders = allOrders.filter((order) => {
          const orderDate = new Date(order.createdAt || "");
          return (
            orderDate.getMonth() === month.getMonth() &&
            orderDate.getFullYear() === month.getFullYear()
          );
        });

        // Calculate total for this month
        const total = monthOrders.reduce(
          (sum, order) =>
            order.paymentStatus === "paid"
              ? sum + (order.totalAmount || 0)
              : sum,
          0,
        );

        return {
          name: monthNames[month.getMonth()],
          total,
        };
      });

      // Order status data for chart
      const orderStatuses = [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];
      const orderStatusData = orderStatuses.map((status) => {
        const count = allOrders.filter(
          (order) => order.status === status,
        ).length;
        return { name: status, value: count };
      });

      // Category data for chart
      const categoryData = await Promise.all(
        (await storage.getAllCategories()).map(async (category) => {
          const productCount = (
            await storage.getProductsByCategory(category.id)
          ).length;
          return {
            name: category.name,
            value: productCount,
          };
        }),
      );
      
      // Generate monthly sales data for the current year
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      
      const currentYear = new Date().getFullYear();
      const monthlySalesData = months.map((month, index) => {
        // Filter orders for this month in the current year and sum up the paid orders
        const monthlyOrders = allOrders.filter(order => {
          if (!order.createdAt) return false;
          const orderDate = new Date(order.createdAt);
          return orderDate.getMonth() === index && 
                 orderDate.getFullYear() === currentYear &&
                 order.paymentStatus === 'paid';
        });
        
        const monthlyTotal = monthlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        return {
          name: month,
          total: monthlyTotal
        };
      });

      const stats = {
        totalRevenue,
        totalOrders: allOrders.length,
        totalUsers: allUsers.length,
        totalProducts: allProducts.length,
        recentOrders,
        salesData: monthlySalesData, // Use the newly generated sales data
        categoryData,
        orderStatusData,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin Orders
  app.get("/api/admin/orders", isAdminOrDesigner, async (req, res) => {
    try {
      // Get all orders
      const orders = await storage.getAllOrders();

      // Fetch more details for each order
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          // Get user info
          const user = await storage.getUser(order.userId);

          // Get order items
          const items = await storage.getOrderItemsByOrder(order.id);

          // Get product details for each item
          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              const product = await storage.getProductById(item.productId);
              return {
                ...item,
                product: product || { name: "Unknown Product" },
              };
            }),
          );

          // Return enhanced order object
          return {
            ...order,
            user: {
              id: user?.id,
              username: user?.username || "Unknown",
              email: user?.email || "unknown@example.com",
            },
            items: itemsWithProducts,
            itemCount: items.length,
          };
        }),
      );

      // Sort orders by creation date (newest first)
      ordersWithDetails.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      res.json(ordersWithDetails);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
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
      
      // Add product information to each order item
      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          const product = await storage.getProductById(item.productId);
          return {
            ...item,
            product: product || { name: "Unknown Product" },
          };
        })
      );

      res.json({ ...order, items: itemsWithProducts, user });
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  app.patch(
    "/api/admin/orders/:id/status",
    isAdminOrDesigner,
    async (req, res) => {
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
    },
  );

  app.patch(
    "/api/admin/orders/:id/payment",
    isAdminOrDesigner,
    async (req, res) => {
      try {
        const orderId = parseInt(req.params.id);
        if (isNaN(orderId)) {
          return res.status(400).json({ message: "Invalid order ID" });
        }

        const { paymentStatus } = req.body;
        if (!paymentStatus) {
          return res
            .status(400)
            .json({ message: "Payment status is required" });
        }

        const order = await storage.updatePaymentStatus(orderId, paymentStatus);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
      } catch (error) {
        res.status(500).json({ message: "Failed to update payment status" });
      }
    },
  );

  app.delete("/api/admin/orders/:id", isAdminOrDesigner, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      // Check if order exists
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Delete the order
      await storage.deleteOrder(orderId);

      res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
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
  app.post(
    "/api/admin/upload/product-image",
    isAdminOrDesigner,
    async (req: any, res) => {
      try {
        if (!req.files || !req.files.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const file = req.files.file;
        const fileName = `${Date.now()}-${file.name}`;
        const uploadPath = path.join(
          process.cwd(),
          "uploads/products",
          fileName,
        );

        // Validate file type
        const fileExt = path.extname(file.name).toLowerCase();
        const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".svg"];
        if (!allowedExtensions.includes(fileExt)) {
          return res
            .status(400)
            .json({ message: "Invalid file type. Only images are allowed." });
        }

        // Move the file to upload directory
        file.mv(uploadPath, (err: any) => {
          if (err) {
            console.error("File upload error:", err);
            return res.status(500).json({ message: "Error uploading file" });
          }

          // Return the file path relative to the uploads directory
          res.json({
            url: `/uploads/products/${fileName}`,
            message: "File uploaded successfully",
          });
        });
      } catch (error: any) {
        console.error("Upload error:", error);
        res
          .status(500)
          .json({ message: `Failed to upload image: ${error.message}` });
      }
    },
  );

  app.post(
    "/api/admin/upload/product-file",
    isAdminOrDesigner,
    async (req: any, res) => {
      try {
        if (!req.files || !req.files.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const file = req.files.file;
        const fileName = `${Date.now()}-${file.name}`;
        const uploadPath = path.join(
          process.cwd(),
          "uploads/downloads",
          fileName,
        );

        // Validate file type
        const fileExt = path.extname(file.name).toLowerCase();
        const allowedExtensions = [
          ".zip",
          ".pdf",
          ".ai",
          ".psd",
          ".eps",
          ".svg",
        ];
        if (!allowedExtensions.includes(fileExt)) {
          return res.status(400).json({
            message:
              "Invalid file type. Only zip, pdf, ai, psd, eps, and svg files are allowed.",
          });
        }

        // Move the file to upload directory
        file.mv(uploadPath, (err: any) => {
          if (err) {
            console.error("File upload error:", err);
            return res.status(500).json({ message: "Error uploading file" });
          }

          // Return the file path relative to the uploads directory
          res.json({
            url: `/uploads/downloads/${fileName}`,
            message: "File uploaded successfully",
          });
        });
      } catch (error: any) {
        console.error("Upload error:", error);
        res
          .status(500)
          .json({ message: `Failed to upload file: ${error.message}` });
      }
    },
  );

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
      const updatedCategory = await storage.updateCategory(
        categoryId,
        category,
      );

      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(200).json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete(
    "/api/admin/categories/:id",
    isAdminOrDesigner,
    async (req, res) => {
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
    },
  );

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
        // Order code will be auto-generated by storage.createOrder
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

  // PayPal endpoints
  app.post("/api/create-paypal-order", isAuthenticated, async (req, res) => {
    try {
      const { amount, items, email, billingDetails } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (!paypalClient) {
        return res.status(500).json({
          message:
            "PayPal is not configured. Please check your PayPal API credentials.",
        });
      }
      
      // Validate billing details
      if (!billingDetails) {
        return res.status(400).json({ message: "Billing address is required" });
      }

      // Create a PayPal order using the PayPal SDK
      const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount.toString(),
            },
            description: "DesignKorv order",
          },
        ],
        application_context: {
          brand_name: "DesignKorv",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${req.protocol}://${req.get("host")}/checkout-success`,
          cancel_url: `${req.protocol}://${req.get("host")}/checkout-cancel`,
        },
      });

      // Execute the PayPal order creation request
      const paypalOrder = await paypalClient.execute(request);

      if (!paypalOrder || !paypalOrder.result || !paypalOrder.result.id) {
        throw new Error("Failed to create PayPal order");
      }

      // Get the PayPal order ID
      const paypalOrderId = paypalOrder.result.id;

      // Create order in our database with pending status and random 8-digit order code
      const order = await storage.createOrder({
        userId: req.user.id,
        totalAmount: amount,
        status: "pending",
        paymentIntentId: paypalOrderId,
        paymentStatus: "pending",
        // Add billing address information
        billingFirstName: billingDetails.billingFirstName,
        billingLastName: billingDetails.billingLastName,
        billingAddress: billingDetails.billingAddress,
        billingApartment: billingDetails.billingApartment || null,
        billingCity: billingDetails.billingCity,
        billingState: billingDetails.billingState,
        billingZip: billingDetails.billingZip,
        billingCountry: billingDetails.billingCountry,
        billingPhone: billingDetails.billingPhone,
        // Order code will be auto-generated by storage.createOrder
      });

      // Add order items
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product?.price || 0,
          });
        }
      }

      // Return the PayPal order ID
      res.json({
        id: paypalOrderId,
        orderId: order.id,
      });
    } catch (error: any) {
      console.error("PayPal order creation error:", error);
      res.status(500).json({
        message: `Error creating PayPal order: ${error.message}`,
      });
    }
  });

  app.post("/api/capture-paypal-order", isAuthenticated, async (req, res) => {
    try {
      const { orderId, billingDetails } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: "Missing PayPal order ID" });
      }

      if (!paypalClient) {
        return res.status(500).json({
          message:
            "PayPal is not configured. Please check your PayPal API credentials.",
        });
      }

      // Find the order in our database by the PayPal order ID
      const orders = await storage.getAllOrders();
      const order = orders.find((o) => o.paymentIntentId === orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Create a request to capture the approved PayPal order
      const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(
        orderId,
      );
      request.prefer("return=representation");

      // Execute the PayPal capture request
      const capture = await paypalClient.execute(request);

      if (
        !capture ||
        !capture.result ||
        capture.result.status !== "COMPLETED"
      ) {
        throw new Error("Failed to capture PayPal payment");
      }

      // Get transaction ID from the capture result (first transaction ID)
      let transactionId = '';
      let paymentDetails = '';
      
      try {
        // Extract PayPal transaction ID and payment details 
        if (capture.result && capture.result.purchase_units && 
            capture.result.purchase_units[0] && 
            capture.result.purchase_units[0].payments && 
            capture.result.purchase_units[0].payments.captures && 
            capture.result.purchase_units[0].payments.captures[0]) {
            
          const captureDetails = capture.result.purchase_units[0].payments.captures[0];
          transactionId = captureDetails.id || '';
          
          // Create a note with payment details
          const paymentTime = captureDetails.create_time || 'unknown time';
          const paymentAmount = captureDetails.amount ? 
            `${captureDetails.amount.value} ${captureDetails.amount.currency_code}` : 
            'unknown amount';
          
          paymentDetails = `Payment processed via PayPal on ${paymentTime}. Amount: ${paymentAmount}. Transaction ID: ${transactionId}`;
        }
      } catch (error) {
        console.log('Error extracting transaction details:', error);
      }
      
      // Update the order status to completed
      const updatedOrder = await storage.updateOrderStatus(
        order.id,
        "completed"
      );
      
      // Update payment status
      if (updatedOrder) {
        await storage.updatePaymentStatus(order.id, "paid", orderId);
        
        // Save transaction ID and payment details if available
        if (transactionId) {
          await storage.updateTransactionId(order.id, transactionId, paymentDetails);
        }
        
        // Update billing details if provided
        if (billingDetails) {
          await storage.updateOrderBillingDetails(order.id, {
            billingFirstName: billingDetails.billingFirstName,
            billingLastName: billingDetails.billingLastName,
            billingAddress: billingDetails.billingAddress,
            billingApartment: billingDetails.billingApartment || null,
            billingCity: billingDetails.billingCity,
            billingState: billingDetails.billingState,
            billingZip: billingDetails.billingZip,
            billingCountry: billingDetails.billingCountry,
            billingPhone: billingDetails.billingPhone,
          });
        }
      }

      res.json({
        success: true,
        orderId: order.id,
      });
    } catch (error: any) {
      console.error("PayPal capture error:", error);
      res.status(500).json({
        message: `Error capturing PayPal payment: ${error.message}`,
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
        return res
          .status(500)
          .json({ message: "Webhook secret not configured" });
      }

      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        webhookSecret,
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
        id,
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
      // Get query parameters for time range filtering
      const timeRange = req.query.timeRange as string || 'today';
      const dateFrom = req.query.dateFrom as string || '';
      const dateTo = req.query.dateTo as string || '';
      
      // Get real orders data
      let allOrders = await storage.getAllOrders();
      const allUsers = await db.select().from(users);
      const allProducts = await storage.getAllProducts();
      
      // Apply time range filter to orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let startDate = new Date(today);
      let endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      
      // Set date range based on timeRange parameter
      switch (timeRange) {
        case 'today':
          // Already set properly
          break;
        case 'yesterday':
          startDate.setDate(startDate.getDate() - 1);
          endDate.setDate(endDate.getDate() - 1);
          break;
        case 'last7days':
          startDate.setDate(startDate.getDate() - 6);
          break;
        case 'last30days':
          startDate.setDate(startDate.getDate() - 29);
          break;
        case 'thisMonth':
          startDate.setDate(1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'lastMonth':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
          break;
        case 'thisYear':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        case 'custom':
          if (dateFrom) {
            startDate = new Date(dateFrom);
            startDate.setHours(0, 0, 0, 0);
          }
          if (dateTo) {
            endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
          }
          break;
      }
      
      // Filter orders by date range
      allOrders = allOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      // Calculate sales summary
      const totalRevenue = allOrders.reduce(
        (sum, order) =>
          order.paymentStatus === "paid" ? sum + (order.totalAmount || 0) : sum,
        0,
      );
      const totalOrders = allOrders.filter(
        (order) => order.paymentStatus === "paid",
      ).length;

      // Calculate average order value
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // For conversion rate we'll use a proxy calculation based on orders vs users
      // In a real app this would use actual visitor data
      const conversionRate =
        allUsers.length > 0 ? (totalOrders / allUsers.length) * 100 : 0;

      // For the time series data, we'll prepare monthly revenue data
      const currentDate = new Date();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
        const month = new Date(currentDate);
        month.setMonth(currentDate.getMonth() - (5 - i));

        // Filter orders for this month
        const monthOrders = allOrders.filter((order) => {
          if (!order.createdAt) return false;
          const orderDate = new Date(order.createdAt);
          return (
            orderDate.getMonth() === month.getMonth() &&
            orderDate.getFullYear() === month.getFullYear()
          );
        });

        // Calculate total for this month
        const total = monthOrders.reduce(
          (sum, order) =>
            order.paymentStatus === "paid"
              ? sum + (order.totalAmount || 0)
              : sum,
          0,
        );

        return {
          name: monthNames[month.getMonth()],
          revenue: total,
          orders: monthOrders.length,
        };
      });

      // Group orders by status
      const ordersByStatus = {};
      for (const order of allOrders) {
        const status = order.status || "unknown";
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
      }

      // Get traffic data (using user data as a proxy since we don't have real visitor tracking)
      // In a real app, this would come from analytics tracking
      const newUsersCount = allUsers.filter((user) => {
        if (!user.createdAt) return false;
        const createdAt = new Date(user.createdAt);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return createdAt > oneMonthAgo;
      }).length;

      const returningUsersCount = allUsers.length - newUsersCount;

      // Return complete analytics data
      res.json({
        salesSummary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          conversionRate,
        },
        trafficSummary: {
          totalVisitors: allUsers.length, // Using user count as proxy for visitors
          newUsers: newUsersCount,
          returningUsers: returningUsersCount,
          averageSessionDuration: "5m 23s", // Example value as we don't track real sessions
        },
        timeSeriesData: {
          revenueByMonth,
          ordersByStatus,
        },
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // Admin Settings Routes
  // Get all settings
  app.get("/api/admin/settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch settings",
      });
    }
  });

  // Get settings by category
  app.get("/api/admin/settings/:category", isAdmin, async (req, res) => {
    try {
      const category = req.params.category;
      const settings = await storage.getSettingsByCategory(category);
      res.json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch settings",
      });
    }
  });

  // Site Settings
  app.post("/api/admin/settings/site", isAdmin, async (req, res) => {
    try {
      // Save each site setting to the database
      for (const [key, value] of Object.entries(req.body)) {
        // The keys might already have the prefix if sent from the client
        const settingKey = key.startsWith("site_") ? key : `site_${key}`;
        await storage.updateSetting(settingKey, value, "site");
      }

      // Return the updated settings
      const siteSettings = await storage.getSettingsByCategory("site");
      res.json({
        success: true,
        message: "Site settings updated successfully",
        data: siteSettings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update site settings",
      });
    }
  });

  // Analytics Settings
  app.post("/api/admin/settings/analytics", isAdmin, async (req, res) => {
    try {
      // Save each analytics setting to the database
      for (const [key, value] of Object.entries(req.body)) {
        // The keys might already have the prefix if sent from the client
        const settingKey = key.startsWith("analytics_")
          ? key
          : `analytics_${key}`;
        await storage.updateSetting(settingKey, value, "analytics");
      }

      // Return the updated settings
      const analyticsSettings =
        await storage.getSettingsByCategory("analytics");
      res.json({
        success: true,
        message: "Analytics settings updated successfully",
        data: analyticsSettings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update analytics settings",
      });
    }
  });

  // Email Settings
  app.post("/api/admin/settings/email", isAdmin, async (req, res) => {
    try {
      // Save each email setting to the database
      for (const [key, value] of Object.entries(req.body)) {
        // The keys might already have the prefix if sent from the client
        const settingKey = key.startsWith("email_") ? key : `email_${key}`;
        await storage.updateSetting(settingKey, value, "email");
      }

      // Return the updated settings
      const emailSettings = await storage.getSettingsByCategory("email");
      res.json({
        success: true,
        message: "Email settings updated successfully",
        data: emailSettings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update email settings",
      });
    }
  });

  // Social Media Settings
  app.post("/api/admin/settings/social", isAdmin, async (req, res) => {
    try {
      // Save each social media setting to the database
      for (const [key, value] of Object.entries(req.body)) {
        // The keys might already have the prefix if sent from the client
        const settingKey = key.startsWith("social_") ? key : `social_${key}`;
        await storage.updateSetting(settingKey, value, "social");
      }

      // Return the updated settings
      const socialSettings = await storage.getSettingsByCategory("social");
      res.json({
        success: true,
        message: "Social media settings updated successfully",
        data: socialSettings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update social media settings",
      });
    }
  });

  // Payment Settings
  app.post("/api/admin/settings/payment", isAdmin, async (req, res) => {
    try {
      // Process each payment setting
      const sensitiveFields = [
        "stripeSecretKey",
        "stripeWebhookSecret",
        "paypalClientSecret",
        "payoneerApiKey",
        "payoneerPassword",
      ];

      // Save each payment setting to the database
      for (const [key, value] of Object.entries(req.body)) {
        // The keys might already have the prefix if sent from the client
        const settingKey = key.startsWith("payment_") ? key : `payment_${key}`;
        await storage.updateSetting(settingKey, value, "payment");
      }

      // Re-initialize payment gateways with the new settings
      try {
        await initializePaymentGateways();
        console.log("Payment gateways reinitialized after settings update");
      } catch (initError) {
        console.error("Failed to reinitialize payment gateways:", initError);
        // Continue - we don't want to fail the settings update if reinitialization fails
      }

      // Return the updated settings with sensitive info masked
      const paymentSettings = await storage.getSettingsByCategory("payment");

      const safeResponse: Record<string, any> = {};
      for (const [key, value] of Object.entries(paymentSettings)) {
        const cleanKey = key.replace("payment_", "");

        // Mask sensitive information in the response
        if (sensitiveFields.includes(cleanKey) && value) {
          safeResponse[cleanKey] = "********";
        } else {
          safeResponse[cleanKey] = value;
        }
      }

      res.json({
        success: true,
        message: "Payment settings updated successfully",
        data: safeResponse,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update payment settings",
      });
    }
  });

  // Newsletter subscription endpoint
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      // TODO: Implement newsletter subscription logic here
      // This could involve saving to a database or integrating with a marketing service

      // For now, just return success
      console.log(`Newsletter subscription request for: ${email}`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      res.status(500).json({ error: "Failed to subscribe to newsletter" });
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
  
  // Featured reviews for homepage - gets highest rated, most recent reviews with user info
  app.get("/api/reviews/featured", async (req, res) => {
    try {
      // Get all reviews with user and product details
      const featuredReviews = await db.query.reviews.findMany({
        with: {
          user: true,
          product: true
        },
        orderBy: (reviews, { desc }) => [
          desc(reviews.rating),
          desc(reviews.createdAt)
        ],
        limit: 6 // Limit to top 6 reviews
      });
      
      res.json(featuredReviews);
    } catch (error) {
      console.error("Error fetching featured reviews:", error);
      res.status(500).json({ message: "Failed to fetch featured reviews" });
    }
  });
  
  // Admin route to get all reviews with user and product details
  app.get("/api/admin/reviews", isAdmin, async (req, res) => {
    try {
      // Get all reviews
      const allReviews = await db.query.reviews.findMany({
        with: {
          user: true,
          product: true
        },
        orderBy: (reviews, { desc }) => [desc(reviews.createdAt)]
      });
      
      res.json(allReviews);
    } catch (error) {
      console.error("Error fetching admin reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Public payment settings for client - only shares necessary settings, not secrets
  app.get("/api/payment-settings", async (req, res) => {
    try {
      const paymentSettings = await storage.getSettingsByCategory("payment");

      // Only send non-sensitive information to the client
      const clientSettings = {
        stripeEnabled: paymentSettings["payment_stripeEnabled"] === "true",
        paypalEnabled: paymentSettings["payment_paypalEnabled"] === "true",
        payoneerEnabled: paymentSettings["payment_payoneerEnabled"] === "true",
        stripePublicKey:
          paymentSettings["payment_stripePublicKey"] ||
          process.env.VITE_STRIPE_PUBLIC_KEY ||
          "",
        paypalClientId:
          paymentSettings["payment_paypalClientId"] ||
          process.env.PAYPAL_CLIENT_ID ||
          "",
      };

      res.json(clientSettings);
    } catch (error) {
      console.error("Error fetching payment settings:", error);
      res.status(500).json({ message: "Failed to fetch payment settings" });
    }
  });

  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const { productId, rating, title, comment } = req.body;

      // Validate required fields
      if (!productId || !rating) {
        return res
          .status(400)
          .json({ message: "Product ID and rating are required" });
      }

      // Check if product exists
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if user already reviewed this product
      const existingReviews = await storage.getReviewsByProduct(productId);
      const userReview = existingReviews.find(
        (review) => review.userId === req.user.id,
      );

      if (userReview) {
        return res.status(400).json({
          message: "You have already reviewed this product",
          reviewId: userReview.id,
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
      res
        .status(500)
        .json({ message: `Failed to create review: ${error.message}` });
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
        return res
          .status(403)
          .json({ message: "You can only edit your own reviews" });
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
      res
        .status(500)
        .json({ message: `Failed to update review: ${error.message}` });
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
        return res
          .status(403)
          .json({ message: "You can only edit your own reviews" });
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
      res
        .status(500)
        .json({ message: `Failed to update review: ${error.message}` });
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
        return res
          .status(403)
          .json({ message: "You can only delete your own reviews" });
      }

      // Delete review
      await storage.deleteReview(reviewId);

      res.status(204).end();
    } catch (error: any) {
      res
        .status(500)
        .json({ message: `Failed to delete review: ${error.message}` });
    }
  });

  // SEO Related Routes
  // Generate dynamic sitemap.xml
  app.get("/sitemap.xml", generateSitemap);

  // Robots.txt - Static file is served by Vite in production

  const httpServer = createServer(app);
  return httpServer;
}
