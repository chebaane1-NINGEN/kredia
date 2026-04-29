-- Add priority_score column to user table (idempotent)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS priority_score INTEGER NOT NULL DEFAULT 0;

-- Create index for priority_score (drop if exists first)
DROP INDEX IF EXISTS idx_user_priority_score;
CREATE INDEX idx_user_priority_score ON "user"(priority_score);