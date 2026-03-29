import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { pgConnectionString } from './scripts/pg-url';

config({ path: '.env.local' });

export default defineConfig({
  schema: './scripts/schema.ts',
  out: './scripts/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: pgConnectionString(process.env.DATABASE_URL_UNPOOLED)!,
  },
});

