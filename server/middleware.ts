import { Request, Response, NextFunction } from "express";

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized: Please log in to access this resource" });
};

// Middleware to check if user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
};

// Middleware to check if user is a designer or admin
export const isDesignerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && (req.user.role === "designer" || req.user.role === "admin")) {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: Designer or admin role required" });
};

// Validate email domains
export const validateEmailDomain = (email: string): { isValid: boolean; message?: string } => {
  const allowedDomains = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", 
    "icloud.com", "aol.com", "protonmail.com", "mail.com"
  ];
  
  const domain = email.split('@')[1];
  
  if (!allowedDomains.includes(domain)) {
    return { 
      isValid: false, 
      message: "Only email addresses from trusted providers are allowed (gmail.com, yahoo.com, hotmail.com, etc.)" 
    };
  }
  
  return { isValid: true };
};

// Rate limiting for specific endpoints
export const createRateLimitMiddleware = (limit: number, windowMs: number, message: string) => {
  return {
    windowMs,
    max: limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message }
  };
};