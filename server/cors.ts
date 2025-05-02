import { Request, Response, NextFunction } from 'express';

/**
 * CORS middleware for separated frontend/backend deployment
 * This allows requests from the frontend domain in production
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Define allowed origins
  const allowedOrigins = [
    // Add your Netlify URL here once deployed
    'https://your-netlify-app.netlify.app',
    // Local development URLs
    'http://localhost:5000',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  
  // Check if the request origin is in our allowed list
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Allow credentials (cookies, authorization headers)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Allowed request methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  
  // Allowed request headers
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
  );
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}