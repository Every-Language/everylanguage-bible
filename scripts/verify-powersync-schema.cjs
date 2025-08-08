#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SYNC_RULES_FILE = 'powersync/sync-rules.yaml';
const SCHEMA_FILE = 'powersync/AppSchema.ts';

function normalizeSchema(content) {
  // Normalize whitespace and line endings for comparison
  return content
    .replace(/\r\n/g, '\n') // Convert Windows line endings
    .replace(/\s+$/gm, '') // Remove trailing whitespace
    .trim();
}

function generateTempSchema() {
  console.log('🔄 Generating temporary schema from sync rules...');

  if (!fs.existsSync(SYNC_RULES_FILE)) {
    throw new Error(`Sync rules file not found: ${SYNC_RULES_FILE}`);
  }

  // Debug: Show environment variables
  console.log('🔧 PowerSync CLI environment:');
  console.log(`   PROJECT_ID: ${process.env.PROJECT_ID ? 'set' : 'not set'}`);
  console.log(`   ORG_ID: ${process.env.ORG_ID ? 'set' : 'not set'}`);
  console.log(`   AUTH_TOKEN: ${process.env.AUTH_TOKEN ? 'set' : 'not set'}`);
  console.log(`   INSTANCE_ID: ${process.env.INSTANCE_ID ? 'set' : 'not set'}`);

  // Generate schema using PowerSync CLI
  const output = execSync(
    `npx powersync instance sync-rules generate-schema -f "${SYNC_RULES_FILE}" -l js`,
    { encoding: 'utf8' }
  );

  console.log(`🔧 Raw CLI output length: ${output.length} characters`);
  console.log(`🔧 Raw CLI output preview: "${output.substring(0, 150)}..."`);

  // Modify the generated schema to use React Native imports (same as generate script)
  let schemaContent = output;
  
  schemaContent = schemaContent.replace(
    "import { column, Schema, Table } from '@powersync/web';",
    "import { column, Schema, Table } from '@powersync/react-native';"
  );

  schemaContent = schemaContent.replace(
    "// OR: import { column, Schema, Table } from '@powersync/react-native';",
    "// Alternative: import { column, Schema, Table } from '@powersync/web';"
  );

  // Write to temp file and format with Prettier (exact same process as generate script)
  const tempFile = path.join(os.tmpdir(), 'temp-expected-schema.ts');
  fs.writeFileSync(tempFile, schemaContent);
  
  try {
    console.log('🎨 Formatting temporary schema with Prettier...');
    execSync(`npx prettier --write "${tempFile}"`, { encoding: 'utf8' });
    const formattedContent = fs.readFileSync(tempFile, 'utf8');
    const normalized = normalizeSchema(formattedContent);
    
    console.log(`🔧 Normalized schema length: ${normalized.length} characters`);
    console.log(`🔧 Normalized schema preview: "${normalized.substring(0, 150)}..."`);
    
    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    
    return normalized;
  } catch (prettierError) {
    // Fallback to non-formatted version if Prettier fails
    console.warn('⚠️  Prettier formatting failed, using non-formatted schema for comparison');
    const normalized = normalizeSchema(schemaContent);
    console.log(`🔧 Normalized schema length: ${normalized.length} characters`);
    console.log(`🔧 Normalized schema preview: "${normalized.substring(0, 150)}..."`);
    
    return normalized;
  }
}

function verifySchema() {
  console.log('🔍 Verifying PowerSync schema is in sync with sync rules...');

  try {
    // Check if schema file exists
    if (!fs.existsSync(SCHEMA_FILE)) {
      console.error(`❌ Schema file not found: ${SCHEMA_FILE}`);
      console.error('');
      console.error('💡 Run the following command to generate the schema:');
      console.error('   npm run powersync:generate-schema');
      process.exit(1);
    }

    // Read the committed schema
    const committedSchema = normalizeSchema(fs.readFileSync(SCHEMA_FILE, 'utf8'));

    // Generate the expected schema from sync rules
    const expectedSchema = generateTempSchema();

    // Compare the schemas
    if (committedSchema === expectedSchema) {
      console.log('✅ Schema is in sync with sync rules');
      console.log('');
      console.log('📋 Verified schema includes:');
      
      // Extract table names for summary
      const tableMatches = expectedSchema.match(/const (\w+) = new Table/g);
      if (tableMatches) {
        tableMatches.forEach(match => {
          const tableName = match.match(/const (\w+) =/)[1];
          console.log(`  • ${tableName}`);
        });
      }
      
      return true;
    } else {
      console.error('❌ Schema is NOT in sync with sync rules');
      console.error('');
      console.error('🔧 The committed schema file differs from what would be generated from the current sync rules.');
      console.error('');
      
      // Enhanced debugging output
      console.error('🔍 Debugging information:');
      console.error(`   Committed schema length: ${committedSchema.length} characters`);
      console.error(`   Expected schema length:  ${expectedSchema.length} characters`);
      
      // Show a sample of each for comparison
      const committedSample = committedSchema.substring(0, 200);
      const expectedSample = expectedSchema.substring(0, 200);
      console.error('');
      console.error('📄 First 200 characters of committed schema:');
      console.error(`   "${committedSample}..."`);
      console.error('');
      console.error('📄 First 200 characters of expected schema:');
      console.error(`   "${expectedSample}..."`);
      console.error('');
      
      // Check for specific differences in actual imports (not comments)
      const committedImport = committedSchema.match(/^import.*from\s+['"]@powersync\/(web|react-native)['"];/m);
      const expectedImport = expectedSchema.match(/^import.*from\s+['"]@powersync\/(web|react-native)['"];/m);
      
      if (committedImport && expectedImport) {
        const committedPkg = committedImport[1];
        const expectedPkg = expectedImport[1];
        if (committedPkg !== expectedPkg) {
          console.error(`⚠️  Import difference detected: committed uses @powersync/${committedPkg}, expected uses @powersync/${expectedPkg}`);
        }
      }
      
      console.error('💡 To fix this, run:');
      console.error('   npm run powersync:generate-schema');
      console.error('');
      console.error('📝 Then commit the updated schema file:');
      console.error(`   git add ${SCHEMA_FILE}`);
      console.error('   git commit -m "Update PowerSync schema"');
      console.error('');
      
      // Optionally show the diff (basic version)
      const tempFile = path.join(os.tmpdir(), 'expected-schema.ts');
      fs.writeFileSync(tempFile, expectedSchema);
      
      console.error('🔍 For detailed differences, compare:');
      console.error(`   Current:  ${SCHEMA_FILE}`);
      console.error(`   Expected: ${tempFile}`);
      
      // Clean up temp file after a short delay
      setTimeout(() => {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }, 5000);
      
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error verifying PowerSync schema:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  verifySchema();
}

module.exports = { verifySchema }; 