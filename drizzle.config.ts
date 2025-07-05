import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/services/database/schema/*.ts',
  out: './src/shared/services/database/migrations',
  dialect: 'sqlite',
  verbose: true,
  strict: true,
});
