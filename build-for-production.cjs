/**
 * build-for-production.cjs
 * Script to build the application for production
 */

const { execSync } = require('child_process');

console.log('🔨 Building DesignKorv for production...');

// Build with production config
try {
  console.log('📦 Building frontend with production config...');
  execSync('vite build --config vite.prod.config.ts', { stdio: 'inherit' });
  
  console.log('📦 Building backend...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Run Netlify preparation
try {
  console.log('📦 Preparing for Netlify deployment...');
  execSync('node build-for-netlify.cjs', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Netlify preparation failed:', error.message);
  process.exit(1);
}

console.log('🎉 All done! Ready for deployment to Netlify.');