/**
 * build-for-hostinger.js
 * Helper script to prepare the application for Hostinger deployment
 * 
 * Run this script after the normal build process:
 * 1. npm run build
 * 2. node build-for-hostinger.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color for console logs
function logColored(message, color) {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
  };
  console.log(colors[color] + message + colors.reset);
}

// Create directory if it doesn't exist
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    logColored(`Created directory: ${directory}`, 'green');
  }
}

// Copy file with proper error handling
function copyFile(source, destination) {
  try {
    fs.copyFileSync(source, destination);
    logColored(`Copied ${source} to ${destination}`, 'green');
  } catch (error) {
    logColored(`Error copying ${source} to ${destination}: ${error.message}`, 'red');
  }
}

// Copy entire directory
function copyDirectory(source, destination) {
  ensureDirectoryExists(destination);
  const files = fs.readdirSync(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      copyFile(sourcePath, destPath);
    }
  }
}

async function prepareForHostinger() {
  try {
    logColored('Starting Hostinger deployment preparation...', 'blue');
    
    // Define paths
    const publicHtmlDir = './public_html';
    const distDir = './dist';
    const clientHtmlFile = './client/index.html';
    const requiredFiles = [
      { src: './cjs-adapter.cjs', dest: path.join(publicHtmlDir, 'cjs-adapter.cjs') },
      { src: './server.js', dest: path.join(publicHtmlDir, 'server.js') },
      { src: './.htaccess', dest: path.join(publicHtmlDir, '.htaccess') },
      { src: './passenger-nodejs.json', dest: path.join(publicHtmlDir, 'passenger-nodejs.json') },
      { src: './package.json', dest: path.join(publicHtmlDir, 'package.json') },
      { src: './package-lock.json', dest: path.join(publicHtmlDir, 'package-lock.json') }
    ];

    // Create public_html directory if it doesn't exist
    ensureDirectoryExists(publicHtmlDir);
    
    // 1. Copy client index.html to public_html if dist/client/index.html doesn't exist
    if (!fs.existsSync(path.join(distDir, 'client', 'index.html')) && fs.existsSync(clientHtmlFile)) {
      copyFile(clientHtmlFile, path.join(publicHtmlDir, 'index.html'));
    } else if (fs.existsSync(path.join(distDir, 'client', 'index.html'))) {
      copyFile(path.join(distDir, 'client', 'index.html'), path.join(publicHtmlDir, 'index.html'));
    } else {
      logColored('Warning: Could not find index.html to copy!', 'yellow');
      
      // Create a basic index.html as fallback
      const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DesignKorv</title>
  <link rel="stylesheet" href="/assets/index.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`;
      
      fs.writeFileSync(path.join(publicHtmlDir, 'index.html'), fallbackHtml);
      logColored('Created fallback index.html', 'yellow');
    }
    
    // 2. Copy all required files
    for (const file of requiredFiles) {
      if (fs.existsSync(file.src)) {
        copyFile(file.src, file.dest);
      } else {
        logColored(`Warning: ${file.src} does not exist, skipping...`, 'yellow');
      }
    }
    
    // 3. Copy assets directory
    if (fs.existsSync(path.join(distDir, 'client', 'assets'))) {
      copyDirectory(path.join(distDir, 'client', 'assets'), path.join(publicHtmlDir, 'assets'));
    } else if (fs.existsSync(path.join(distDir, 'assets'))) {
      copyDirectory(path.join(distDir, 'assets'), path.join(publicHtmlDir, 'assets'));
    } else {
      logColored('Warning: No assets directory found to copy!', 'yellow');
    }
    
    // 4. Copy dist folder content
    if (fs.existsSync(distDir)) {
      copyDirectory(distDir, publicHtmlDir);
    } else {
      logColored('Warning: dist directory does not exist! Have you run npm run build?', 'red');
    }
    
    // 5. Copy uploads directory
    if (fs.existsSync('./uploads')) {
      copyDirectory('./uploads', path.join(publicHtmlDir, 'uploads'));
    }
    
    // 6. Copy public directory (for static assets)
    if (fs.existsSync('./public')) {
      copyDirectory('./public', publicHtmlDir);
    }
    
    // 7. Create .env file if it doesn't exist
    if (!fs.existsSync(path.join(publicHtmlDir, '.env'))) {
      if (fs.existsSync('./.env.production')) {
        copyFile('./.env.production', path.join(publicHtmlDir, '.env'));
      } else {
        logColored('Warning: No .env.production file found. You will need to create a .env file on the server.', 'yellow');
      }
    }
    
    // 8. Install production dependencies
    logColored('Installing production dependencies...', 'blue');
    fs.writeFileSync(path.join(publicHtmlDir, 'package-lock.json'), fs.readFileSync('./package-lock.json'));
    
    // Optional: Install production dependencies to check if all modules will work
    // Uncomment the following lines if you want to test the installation
    /*
    process.chdir(publicHtmlDir);
    execSync('npm ci --production', { stdio: 'inherit' });
    process.chdir('..');
    */
    
    logColored('✅ Hostinger deployment preparation completed successfully!', 'green');
    logColored('Files have been prepared in the public_html directory.', 'green');
    logColored('Next steps:', 'blue');
    logColored('1. Zip the public_html directory', 'blue');
    logColored('2. Upload the zip file to your Hostinger account', 'blue');
    logColored('3. Extract the files on the server', 'blue');
    logColored('4. Configure Node.js in Hostinger panel', 'blue');
    logColored('5. Test your application', 'blue');
    
  } catch (error) {
    logColored(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

prepareForHostinger();