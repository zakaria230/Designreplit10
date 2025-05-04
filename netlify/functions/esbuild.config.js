// esbuild.config.js - Configuration for Netlify Functions
module.exports = {
  target: 'node14',
  platform: 'node',
  format: 'cjs',
  bundle: true,
  minify: false,
  sourcemap: true,
  external: [
    // Node.js built-ins
    'fs', 'path', 'http', 'https', 'crypto', 'zlib', 'util', 'stream', 'buffer',
    // External dependencies that might cause issues when bundled
    '@neondatabase/serverless',
    'pg-native',
    'better-sqlite3',
  ],
  loader: {
    '.js': 'jsx',
    '.ts': 'tsx',
    '.jsx': 'jsx',
    '.tsx': 'tsx',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: []
};