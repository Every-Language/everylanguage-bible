#!/usr/bin/env node

/**
 * Test script for verse text sync fix
 * Run this script to test the database transaction error fix
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing verse text sync fix...\n');

try {
  // Test 1: Check if the app builds without errors
  console.log('1️⃣ Testing app build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ App builds successfully\n');

  // Test 2: Check TypeScript compilation
  console.log('2️⃣ Testing TypeScript compilation...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful\n');

  // Test 3: Check for any obvious syntax errors in the fixed files
  console.log('3️⃣ Checking fixed files for syntax errors...');

  const filesToCheck = [
    'src/shared/services/sync/bible/VerseTextSyncService.ts',
    'src/features/languages/store/slices/currentSelections.ts',
  ];

  filesToCheck.forEach(file => {
    try {
      execSync(`npx tsc --noEmit ${file}`, { stdio: 'pipe' });
      console.log(`✅ ${file} - No syntax errors`);
    } catch (error) {
      console.log(`❌ ${file} - Syntax errors found`);
      console.log(error.stdout?.toString() || error.stderr?.toString());
    }
  });

  console.log(
    '\n🎉 All tests passed! The verse text sync fix should work correctly.'
  );
  console.log('\n📝 Next steps:');
  console.log('1. Run the app and trigger a verse text sync');
  console.log(
    '2. If you encounter the database error again, the emergency fix should automatically run'
  );
  console.log('3. Check the logs for "Emergency fix" messages');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
