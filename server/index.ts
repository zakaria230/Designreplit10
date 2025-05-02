import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import csrf from "csurf";

const app = express();

// Security middlewares
// Apply helmet for secure headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://www.paypal.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://www.paypalobjects.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://www.paypal.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://www.paypal.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
  // Allow iframes for payment providers
  frameguard: { action: 'sameorigin' }
}));

// Rate limiting to prevent brute force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: "Too many requests from this IP, please try again later." }
});

// More aggressive rate limiting for auth routes to prevent brute force
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." }
});

// Apply rate limiting to API routes
app.use("/api/", apiLimiter);
app.use(["/api/login", "/api/register"], authLimiter);

// Parse request bodies
app.use(express.json({ limit: '1mb' })); // Limit size for DDoS protection
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the PORT environment variable or default to 5000
  // This allows cPanel to set the appropriate port
  const port = process.env.PORT || 5000;
  
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    // Only use reusePort if not in production (may not be supported in all environments)
    ...(process.env.NODE_ENV !== 'production' ? { reusePort: true } : {})
  }, () => {
    log(`Server running on port ${port}`);
    log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})();
