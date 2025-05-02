# Deploying DesignKorv to Netlify

This guide outlines the steps to deploy the DesignKorv e-commerce platform to Netlify, splitting it into a frontend (Netlify) and backend (separate service) architecture.

> **IMPORTANT**: Before deploying, consider clearing test data from your database to start fresh. Use the provided script by running:
> ```bash
> # Make the script executable
> chmod +x clear-db.sh
> # Run the script
> ./clear-db.sh
> ```
> This will keep your admin account and site settings but clear all products, orders, and other test data.

## Prerequisites

1. A Netlify account (sign up at [netlify.com](https://netlify.com))
2. Git repository for your project
3. A separate backend hosting service (Render, Railway, Heroku, etc.)
4. A database service (Neon, Supabase, Railway, etc.)

## Setup Steps

### 1. Prepare your backend

First, you need to deploy your backend API separately:

- Choose a Node.js hosting platform like Render, Railway, or Heroku
- Deploy the Express server portion of your app
- Make sure your PostgreSQL database is set up and connected
- Note down the URL of your deployed backend (e.g., `https://designkorv-api.onrender.com`)

### 2. Update environment variables

In the `.env.production` file, update the backend API URL:

```
VITE_API_URL=https://your-backend-api-url.com
```

Replace `https://your-backend-api-url.com` with the actual URL of your deployed backend.

### 3. Build the frontend for Netlify

Run the build script:

```bash
npm run build
node build-for-netlify.js
```

This will:
- Build the frontend portion of your app
- Create necessary Netlify configuration files
- Update the redirect rules to point to your backend

### 4. Deploy to Netlify

#### Option 1: Deploy via the Netlify UI

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "New site from Git"
3. Connect to your Git repository
4. Set the build command to: `npm run build`
5. Set the publish directory to: `dist/client`
6. Add the following environment variables:
   - `VITE_API_URL` = Your backend API URL
   - `VITE_STRIPE_PUBLIC_KEY` = Your Stripe public key
7. Click "Deploy site"

#### Option 2: Deploy using Netlify CLI

1. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize your site:
   ```bash
   netlify init
   ```

4. Deploy your site:
   ```bash
   netlify deploy --prod
   ```

### 5. Set up redirects

Ensure your `_redirects` file in the `dist/client` directory includes:

```
# Redirects API requests to the backend server
/api/*  https://your-backend-api-url.com/api/:splat  200
/*      /index.html                                  200
```

Replace `https://your-backend-api-url.com` with your actual backend URL.

### 6. Configure CORS on your backend

Add the CORS middleware to your backend server (`server/index.ts`) to allow requests from your Netlify domain:

```typescript
// Import the CORS middleware
import { corsMiddleware } from './cors';

// Add this to the top of your express app configuration, before other middlewares
// For production deployment with separate frontend/backend
app.use(corsMiddleware);

// Make sure to update the allowed origins in server/cors.ts with your Netlify domain
```

The CORS middleware (in `server/cors.ts`) should be configured with your Netlify domain:

```typescript
const allowedOrigins = [
  'https://your-netlify-app.netlify.app', // Replace with your actual Netlify URL
  'http://localhost:5000',
  'http://localhost:3000'
];
```

### 7. Update session configuration for cross-domain cookies

When your frontend and backend are on different domains, you need to configure session cookies properly. Add the following changes to your `server/auth.ts` or wherever you set up your session configuration:

```typescript
// Update session configuration to work across domains
const sessionSettings: session.SessionOptions = {
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: { 
    secure: true, // Use secure cookies in production
    sameSite: 'none', // Required for cross-domain cookies
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
};

// Use secure cookies only in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy
  sessionSettings.cookie!.secure = true;
} else {
  sessionSettings.cookie!.secure = false;
}

app.use(session(sessionSettings));
```

## Troubleshooting

### Common Issues:

1. **API calls failing**: Check CORS settings on your backend server
2. **Authentication not working**: Ensure your cookies are set with the appropriate settings for cross-domain requests
   - Check that `sameSite: 'none'` and `secure: true` are set in production
   - Verify that your backend domain is configured as a trusted origin
3. **Environment variables not working**: Verify they are set correctly in Netlify's environment settings
4. **Session cookies not persisting**: Make sure your backend sets the proper cookie attributes and that the browsers aren't blocking third-party cookies

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Split Backend Deployments](https://www.netlify.com/blog/2021/03/16/how-to-deploy-to-netlify-split-backend-and-frontend-deployment-without-monorepo/)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)