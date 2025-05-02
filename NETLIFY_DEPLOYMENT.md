# Deploying DesignKorv to Netlify

This guide outlines the steps to deploy the DesignKorv e-commerce platform to Netlify, splitting it into a frontend (Netlify) and backend (separate service) architecture.

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

Update your backend server to allow requests from your Netlify domain:

```javascript
// In your Express server:
app.use(cors({
  origin: ['https://your-netlify-app.netlify.app', 'http://localhost:5000'],
  credentials: true
}));
```

## Troubleshooting

### Common Issues:

1. **API calls failing**: Check CORS settings on your backend server
2. **Authentication not working**: Ensure your cookies are set with the appropriate settings for cross-domain requests
3. **Environment variables not working**: Verify they are set correctly in Netlify's environment settings

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Split Backend Deployments](https://www.netlify.com/blog/2021/03/16/how-to-deploy-to-netlify-split-backend-and-frontend-deployment-without-monorepo/)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)