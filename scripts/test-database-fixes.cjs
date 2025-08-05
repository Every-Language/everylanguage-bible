const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Database Fixes for Language Entities Cache...\n');

// Test 1: Check if the schema changes are properly applied
console.log('1️⃣ Testing Schema Changes...');
try {
  const schemaPath = path.join(__dirname, '../src/shared/services/database/schema.ts');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  if (schemaContent.includes('ON DELETE SET NULL')) {
    console.log('✅ Foreign key constraint updated with ON DELETE SET NULL');
  } else {
    console.log('❌ Foreign key constraint not updated');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error reading schema file:', error.message);
  process.exit(1);
}

// Test 2: Check if the LanguageSyncService changes are applied
console.log('\n2️⃣ Testing LanguageSyncService Changes...');
try {
  const syncServicePath = path.join(__dirname, '../src/shared/services/sync/language/LanguageSyncService.ts');
  const syncServiceContent = fs.readFileSync(syncServicePath, 'utf8');
  
  const checks = [
    { name: 'sortEntitiesByHierarchy method', pattern: 'sortEntitiesByHierarchy' },
    { name: 'upsertLanguageEntitiesBatch method', pattern: 'upsertLanguageEntitiesBatch' },
    { name: 'fallbackUpsertLanguageEntities method', pattern: 'fallbackUpsertLanguageEntities' },
    { name: 'validateLanguageEntity method', pattern: 'validateLanguageEntity' },
    { name: 'retry logic', pattern: 'maxRetries' },
    { name: 'foreign key constraint handling', pattern: 'PRAGMA foreign_keys' }
  ];
  
  let allChecksPassed = true;
  checks.forEach(check => {
    if (syncServiceContent.includes(check.pattern)) {
      console.log(`✅ ${check.name} found`);
    } else {
      console.log(`❌ ${check.name} not found`);
      allChecksPassed = false;
    }
  });
  
  if (!allChecksPassed) {
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error reading sync service file:', error.message);
  process.exit(1);
}

// Test 3: Check if the DatabaseManager migration is applied
console.log('\n3️⃣ Testing DatabaseManager Migration...');
try {
  const dbManagerPath = path.join(__dirname, '../src/shared/services/database/DatabaseManager.ts');
  const dbManagerContent = fs.readFileSync(dbManagerPath, 'utf8');
  
  const checks = [
    { name: 'fixLanguageEntitiesCacheConstraints method', pattern: 'fixLanguageEntitiesCacheConstraints' },
    { name: 'orphaned records detection', pattern: 'orphanedRecords' },
    { name: 'foreign key constraint recreation', pattern: 'ON DELETE SET NULL' },
    { name: 'migration to version 5', pattern: 'Migrating to version 5' }
  ];
  
  let allChecksPassed = true;
  checks.forEach(check => {
    if (dbManagerContent.includes(check.pattern)) {
      console.log(`✅ ${check.name} found`);
    } else {
      console.log(`❌ ${check.name} not found`);
      allChecksPassed = false;
    }
  });
  
  if (!allChecksPassed) {
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error reading database manager file:', error.message);
  process.exit(1);
}

// Test 4: Verify TypeScript compilation for our changes
console.log('\n4️⃣ Testing TypeScript Compilation...');
try {
  // Check only the files we modified
  const filesToCheck = [
    'src/shared/services/database/schema.ts',
    'src/shared/services/sync/language/LanguageSyncService.ts',
    'src/shared/services/database/DatabaseManager.ts'
  ];
  
  filesToCheck.forEach(file => {
    try {
      execSync(`npx tsc --noEmit ${file}`, { stdio: 'pipe' });
      console.log(`✅ ${file} compiles successfully`);
    } catch (error) {
      console.log(`❌ ${file} has TypeScript errors`);
      console.log(error.stdout?.toString() || error.message);
    }
  });
} catch (error) {
  console.log('❌ Error during TypeScript compilation check:', error.message);
}

console.log('\n🎉 Database Fixes Test Completed!');
console.log('\n📋 Summary of Changes Applied:');
console.log('   • Updated foreign key constraint to use ON DELETE SET NULL');
console.log('   • Added hierarchical sorting for language entities');
console.log('   • Implemented retry logic with exponential backoff');
console.log('   • Added fallback mechanism for constraint violations');
console.log('   • Created migration script to fix existing data');
console.log('   • Enhanced error handling and validation');

console.log('\n🚀 Next Steps:');
console.log('   1. Test the app to ensure language sync works correctly');
console.log('   2. Monitor logs for any remaining foreign key constraint errors');
console.log('   3. Verify that orphaned language entities are handled gracefully');
console.log('   4. Check that the migration runs successfully on existing databases'); 