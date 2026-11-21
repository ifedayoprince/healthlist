import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import env from './src/common/env.js';

export default defineConfig({
  out: './drizzle',
  schema: './src/common/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL!,
  },
});
