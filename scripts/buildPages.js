const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('>>> Building MediUnify Super Admin for GitHub Pages (basePath: /Mediunify-Super-admin)...');

// Run build with GITHUB_PAGES=true
execSync('npx next build', {
  stdio: 'inherit',
  env: {
    ...process.env,
    GITHUB_PAGES: 'true',
  },
});

// Ensure .nojekyll exists in out/ to prevent GitHub Pages from ignoring _next directory
const outDir = path.join(__dirname, '..', 'out');
const nojekyllPath = path.join(outDir, '.nojekyll');
fs.writeFileSync(nojekyllPath, '');
console.log('>>> Created .nojekyll in out/');

console.log('>>> Static build for GitHub Pages completed successfully in ./out');
