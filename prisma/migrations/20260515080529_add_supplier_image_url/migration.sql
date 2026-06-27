-- AlterTable (fixed: skip if column already exists from prior migration)
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "image_url" TEXT;
