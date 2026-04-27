-- Favicon URL per portal theme (Vercel Blob atau path publik)
ALTER TABLE "core_portal_themes" ADD COLUMN IF NOT EXISTS "favicon_url" text;
