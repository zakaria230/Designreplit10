# InMotion Hosting Setup Guide

## Files prepared:
- app.js: Simple Express server that serves the static files
- package.inmotion.json: Simplified package.json for InMotion
- passenger-nodejs.json: Configuration for Passenger

## Deployment Instructions:

### 1. Build the application
```bash
npm run build
```

### 2. Copy these files to your InMotion hosting:
- dist/ folder (contains the built client application)
- uploads/ folder (contains uploaded images)
- app.js (rename package.inmotion.json to package.json)
- package.inmotion.json (rename to package.json on the server)
- passenger-nodejs.json

### 3. Setup Node.js application in InMotion:
- Application startup file: app.js
- Node.js version: 18.x
- Environment: Production

### 4. Install Express on the server
```bash
cd ~/your_app_directory
npm install express
```

### 5. Restart the Node.js application

## Debugging
If you encounter issues, check the following:
- logs in ~/logs directory
- Make sure all files were uploaded correctly
- Ensure Express is installed
