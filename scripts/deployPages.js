const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'out');

console.log('>>> Step 1: Building Next.js static export for GitHub Pages...');
require('./buildPages');

console.log('>>> Step 2: Preparing gh-pages git branch in ./out...');
// Remove any existing .git inside out/
const outGit = path.join(outDir, '.git');
if (fs.existsSync(outGit)) {
  fs.rmSync(outGit, { recursive: true, force: true });
}

execSync('git init', { cwd: outDir, stdio: 'inherit' });
execSync('git config user.name "internship-ui"', { cwd: outDir, stdio: 'inherit' });
execSync('git config user.email "internship@navabharathtechnologies.com"', { cwd: outDir, stdio: 'inherit' });
execSync('git checkout -b gh-pages', { cwd: outDir, stdio: 'inherit' });
execSync('git add -A', { cwd: outDir, stdio: 'inherit' });
execSync('git commit -m "deploy: update GitHub Pages build"', { cwd: outDir, stdio: 'inherit' });
execSync('git remote add origin https://github.com/internship-ui/Mediunify-Super-admin.git', { cwd: outDir, stdio: 'inherit' });

console.log('>>> Step 3: Pushing gh-pages branch to origin...');
execSync('git push -f origin gh-pages', { cwd: outDir, stdio: 'inherit' });

console.log('>>> SUCCESS! gh-pages branch updated on GitHub.');
