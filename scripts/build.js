import { execSync } from 'child_process';

if (process.env.CONVEX_DEPLOY_KEY) {
  console.log('CONVEX_DEPLOY_KEY detected. Deploying Convex backend schema & functions...');
  execSync('npx convex deploy --cmd "npm run build:app"', { stdio: 'inherit' });
} else {
  console.log('Building Vite application...');
  execSync('npm run build:app', { stdio: 'inherit' });
}
