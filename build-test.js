/**
 * Simple script to test the build directory structure
 * Run with: node build-test.js
 */

const fs = require('fs');
const path = require('path');

console.log('Testing build directory structure...');

// Check if dist/public exists and what it contains
if (fs.existsSync('dist/public')) {
  console.log('\nFound dist/public directory:');
  const publicFiles = fs.readdirSync('dist/public');
  publicFiles.forEach(file => {
    console.log(`- ${file}`);
  });
} else {
  console.log('\ndist/public directory not found');
}

// Check if dist/client exists and what it contains
if (fs.existsSync('dist/client')) {
  console.log('\nFound dist/client directory:');
  const clientFiles = fs.readdirSync('dist/client');
  clientFiles.forEach(file => {
    console.log(`- ${file}`);
  });
} else {
  console.log('\ndist/client directory not found');
}

// Check if index.html exists in either directory
if (fs.existsSync('dist/public/index.html')) {
  console.log('\nindex.html found in dist/public');
} else {
  console.log('\nindex.html NOT found in dist/public');
}

if (fs.existsSync('dist/client/index.html')) {
  console.log('index.html found in dist/client');
} else {
  console.log('index.html NOT found in dist/client');
}

// Check the netlify.toml configuration
if (fs.existsSync('netlify.toml')) {
  const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
  console.log('\nNetlify configuration publish directory:');
  
  const publishMatch = netlifyConfig.match(/publish\s*=\s*"([^"]+)"/);
  if (publishMatch) {
    console.log(`publish = "${publishMatch[1]}"`);
  } else {
    console.log('publish directory not found in netlify.toml');
  }
} else {
  console.log('\nnetlify.toml file not found');
}

// Check vite.config.ts configuration
if (fs.existsSync('vite.config.ts')) {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  console.log('\nVite configuration output directory:');
  
  const outDirMatch = viteConfig.match(/outDir:\s*[^\n,}]+/);
  if (outDirMatch) {
    console.log(`outDir: ${outDirMatch[0].replace('outDir:', '').trim()}`);
  } else {
    console.log('outDir not found in vite.config.ts');
  }
} else {
  console.log('\nvite.config.ts file not found');
}