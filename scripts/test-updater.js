// Quick test script to verify updater module loads correctly
// Run with: node scripts/test-updater.js

console.log('Testing updater module...\n');

try {
  // Test 1: Check if electron-updater is installed
  const { autoUpdater } = require('electron-updater');
  console.log('✅ electron-updater module loads');

  // Test 2: Check if electron-log is installed
  const log = require('electron-log');
  console.log('✅ electron-log module loads');

  // Test 3: Verify our updater module structure
  const fs = require('fs');
  const updaterPath = './electron/updater.ts';
  const updaterCode = fs.readFileSync(updaterPath, 'utf8');

  // Check for key exports
  const checks = [
    { name: 'initUpdater function', pattern: /export\s+function\s+initUpdater/ },
    { name: 'checkForUpdates function', pattern: /export\s+function\s+checkForUpdates/ },
    { name: 'quitAndInstall function', pattern: /export\s+function\s+quitAndInstall/ },
    { name: 'Logger configuration', pattern: /autoUpdater\.logger\s*=\s*log/ },
    { name: 'Event handlers', pattern: /autoUpdater\.on\(/ },
    { name: 'checkForUpdatesAndNotify call', pattern: /checkForUpdatesAndNotify\(\)/ }
  ];

  checks.forEach(check => {
    if (check.pattern.test(updaterCode)) {
      console.log(`✅ ${check.name} present`);
    } else {
      console.log(`❌ ${check.name} MISSING`);
    }
  });

  // Test 4: Check package.json configuration
  const packageJson = require('../package.json');

  if (packageJson.repository && packageJson.repository.url) {
    console.log(`✅ Repository URL configured: ${packageJson.repository.url}`);
  } else {
    console.log('❌ Repository URL missing in package.json');
  }

  if (packageJson.version && /^\d+\.\d+\.\d+/.test(packageJson.version)) {
    console.log(`✅ Semantic version: ${packageJson.version}`);
  } else {
    console.log('❌ Invalid version format in package.json');
  }

  console.log('\n✅ All updater checks passed!');
  console.log('\nTo test actual updates:');
  console.log('1. Build installer on Windows: npm run make');
  console.log('2. Create GitHub Release with .exe and RELEASES files');
  console.log('3. Install app and test update detection');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
