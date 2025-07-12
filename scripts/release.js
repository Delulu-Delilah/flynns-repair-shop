#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const currentVersion = packageJson.version;
console.log(`Current version: ${currentVersion}`);

// Get the release type from command line arguments
const releaseType = process.argv[2] || 'patch';
const validTypes = ['patch', 'minor', 'major'];

if (!validTypes.includes(releaseType)) {
  console.error(`Invalid release type. Use one of: ${validTypes.join(', ')}`);
  process.exit(1);
}

try {
  // Bump version
  console.log(`Bumping version (${releaseType})...`);
  execSync(`npm version ${releaseType} --no-git-tag-version`, { stdio: 'inherit' });
  
  // Read the new version
  const newPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const newVersion = newPackageJson.version;
  
  // Create git tag
  console.log(`Creating git tag v${newVersion}...`);
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
  
  // Push changes and tag
  console.log('Pushing changes and tag...');
  execSync('git push', { stdio: 'inherit' });
  execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
  
  console.log(`\n🎉 Successfully created release v${newVersion}!`);
  console.log(`\nThe GitHub Actions workflow will now:`);
  console.log(`1. Build the app for Windows, macOS, and Linux`);
  console.log(`2. Create a GitHub release with all assets`);
  console.log(`3. Make the app available for download`);
  console.log(`\nMonitor the build at: https://github.com/Delulu-Delilah/flynns-repair-shop/actions`);
  
} catch (error) {
  console.error('Error creating release:', error.message);
  process.exit(1);
} 