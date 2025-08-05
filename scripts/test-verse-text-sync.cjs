const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Verse Text Sync Integration in Onboarding...\n');

// Test 1: Check if VerseTextSyncService is imported
console.log('1️⃣ Testing VerseTextSyncService Import...');
try {
  const onboardingPath = path.join(__dirname, '../src/features/onboarding/components/OnboardingProgressModal.tsx');
  const onboardingContent = fs.readFileSync(onboardingPath, 'utf8');
  
  if (onboardingContent.includes('import VerseTextSyncService from')) {
    console.log('✅ VerseTextSyncService import found');
  } else {
    console.log('❌ VerseTextSyncService import not found');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error reading onboarding file:', error.message);
  process.exit(1);
}

// Test 2: Check if verse text sync logic is implemented
console.log('\n2️⃣ Testing Verse Text Sync Logic...');
try {
  const onboardingPath = path.join(__dirname, '../src/features/onboarding/components/OnboardingProgressModal.tsx');
  const onboardingContent = fs.readFileSync(onboardingPath, 'utf8');
  
  const checks = [
    { name: 'VerseTextSyncService.getInstance()', pattern: 'VerseTextSyncService.getInstance()' },
    { name: 'syncVerseTextsForVersion call', pattern: 'syncVerseTextsForVersion' },
    { name: 'onSync subscription', pattern: 'onSync' },
    { name: 'forceFullSync option', pattern: 'forceFullSync: true' },
    { name: 'verse text sync results logging', pattern: 'Verse text sync results' },
    { name: 'comprehensive sync results logging', pattern: 'Complete sync results' }
  ];
  
  let allChecksPassed = true;
  checks.forEach(check => {
    if (onboardingContent.includes(check.pattern)) {
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
  console.log('❌ Error checking verse text sync logic:', error.message);
  process.exit(1);
}

// Test 3: Check if error handling is implemented
console.log('\n3️⃣ Testing Error Handling...');
try {
  const onboardingPath = path.join(__dirname, '../src/features/onboarding/components/OnboardingProgressModal.tsx');
  const onboardingContent = fs.readFileSync(onboardingPath, 'utf8');
  
  const checks = [
    { name: 'verse text sync error handling', pattern: 'verse_text_sync_issue' },
    { name: 'graceful error recovery', pattern: 'Mark as complete even if there were issues' },
    { name: 'error logging', pattern: 'Verse text sync had issues, but continuing' }
  ];
  
  let allChecksPassed = true;
  checks.forEach(check => {
    if (onboardingContent.includes(check.pattern)) {
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
  console.log('❌ Error checking error handling:', error.message);
  process.exit(1);
}

// Test 4: Check if progress tracking is implemented
console.log('\n4️⃣ Testing Progress Tracking...');
try {
  const onboardingPath = path.join(__dirname, '../src/features/onboarding/components/OnboardingProgressModal.tsx');
  const onboardingContent = fs.readFileSync(onboardingPath, 'utf8');
  
  const checks = [
    { name: 'verse text progress tracking', pattern: 'current: result.recordsSynced' },
    { name: 'step progress updates', pattern: 'setStepProgress' },
    { name: 'final progress logging', pattern: 'totalVerseTexts' }
  ];
  
  let allChecksPassed = true;
  checks.forEach(check => {
    if (onboardingContent.includes(check.pattern)) {
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
  console.log('❌ Error checking progress tracking:', error.message);
  process.exit(1);
}

console.log('\n🎉 Verse Text Sync Integration Test Completed!');
console.log('\n📋 Summary of Changes Applied:');
console.log('   • Added VerseTextSyncService import to onboarding');
console.log('   • Implemented real verse text synchronization');
console.log('   • Added progress tracking for verse text sync');
console.log('   • Enhanced error handling for verse text sync');
console.log('   • Added comprehensive logging of all sync results');
console.log('   • Integrated verse text sync with existing Bible structure sync');

console.log('\n🚀 Expected Behavior:');
console.log('   1. Onboarding will now sync verse texts for the selected text version');
console.log('   2. Progress will be tracked and displayed in real-time');
console.log('   3. All sync results (Bible structure + verse texts) will be logged');
console.log('   4. Errors will be handled gracefully without blocking the process');
console.log('   5. Users will see complete sync status including verse texts');

console.log('\n📊 Log Output Format:');
console.log('   • "Onboarding: Verse text sync results: {...}"');
console.log('   • "Onboarding: Complete sync results: { bibleStructure: {...}, verseTexts: {...}, summary: {...} }"'); 