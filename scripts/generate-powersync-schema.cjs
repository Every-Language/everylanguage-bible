#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SYNC_RULES_FILE = 'powersync/sync-rules.yaml';
const SCHEMA_OUTPUT_FILE = 'powersync/AppSchema.ts';

function generateSchema() {
  console.log('🔄 Generating PowerSync schema from sync rules...');

  try {
    // Check if sync rules file exists
    if (!fs.existsSync(SYNC_RULES_FILE)) {
      throw new Error(`Sync rules file not found: ${SYNC_RULES_FILE}`);
    }

    // Generate schema using PowerSync CLI
    console.log('📄 Running PowerSync CLI to generate schema...');
    const output = execSync(
      `npx powersync instance sync-rules generate-schema -f "${SYNC_RULES_FILE}" -l js`,
      { encoding: 'utf8' }
    );

    // Extract the generated schema (skip the import line and modify it)
    let schemaContent = output;
    
    // Replace the web import with react-native import
    schemaContent = schemaContent.replace(
      "import { column, Schema, Table } from '@powersync/web';",
      "import { column, Schema, Table } from '@powersync/react-native';"
    );

    // Also handle the alternative comment import
    schemaContent = schemaContent.replace(
      "// OR: import { column, Schema, Table } from '@powersync/react-native';",
      "// Alternative: import { column, Schema, Table } from '@powersync/web';"
    );

    // Ensure the powersync directory exists
    const schemaDir = path.dirname(SCHEMA_OUTPUT_FILE);
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true });
    }

    // Write the modified schema to the output file
    fs.writeFileSync(SCHEMA_OUTPUT_FILE, schemaContent);

    console.log(`✅ Schema generated successfully: ${SCHEMA_OUTPUT_FILE}`);
    console.log('');
    console.log('📋 Generated schema includes the following tables:');
    
    // Extract table names from the schema for summary
    const tableMatches = schemaContent.match(/const (\w+) = new Table/g);
    if (tableMatches) {
      tableMatches.forEach(match => {
        const tableName = match.match(/const (\w+) =/)[1];
        console.log(`  • ${tableName}`);
      });
    }

    console.log('');
    console.log('💡 You can now import this schema in your PowerSync setup:');
    console.log(`   import { AppSchema } from './${SCHEMA_OUTPUT_FILE.replace('.ts', '')}';`);

  } catch (error) {
    console.error('❌ Error generating PowerSync schema:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateSchema();
}

module.exports = { generateSchema }; 