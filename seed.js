import { execSync } from 'child_process';

console.log('Running database seed...');
try {
  execSync('cd server && NODE_ENV=development npx tsx seed.ts', { stdio: 'inherit' });
  console.log('Database seed completed successfully!');
} catch (error) {
  console.error('Error while seeding database:', error);
  process.exit(1);
}