-- V20260227162000__upgrade_reclamation_to_v1.sql
-- Upgrade reclamation table from v2 -> v1

START TRANSACTION;

-- ------------------------------------------------------------
-- 0) Normalize existing data to avoid ENUM conversion errors
-- ------------------------------------------------------------

-- Fix possible status values before switching to ENUM
UPDATE reclamation
SET status = 'IN_PROGRESS'
WHERE status IN ('IN PROGRESS', 'IN-PROGRESS', 'INPROGRESS');

UPDATE reclamation
SET status = 'OPEN'
WHERE status NOT IN ('OPEN','IN_PROGRESS','RESOLVED','REJECTED');

-- Fix possible priority values before switching to ENUM
UPDATE reclamation
SET priority = 'MEDIUM'
WHERE priority NOT IN ('LOW','MEDIUM','HIGH');

-- ------------------------------------------------------------
-- 1) Drop FK that depends on user_id index (mandatory)
--    We drop by detected FK name (robust)
-- ------------------------------------------------------------

SET @fk_name := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reclamation'
    AND COLUMN_NAME = 'user_id'
    AND REFERENCED_TABLE_NAME = 'user'
  LIMIT 1
);

SET @sql_drop_fk := IF(
  @fk_name IS NULL,
  'SELECT 1',
  CONCAT('ALTER TABLE reclamation DROP FOREIGN KEY ', @fk_name)
);

PREPARE stmt FROM @sql_drop_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 2) Drop old indexes (v2) safely (robust)
-- ------------------------------------------------------------

-- Helper: drop index if exists
SET @idx := (SELECT 1 FROM information_schema.statistics
             WHERE table_schema = DATABASE()
               AND table_name = 'reclamation'
               AND index_name = 'idx_reclam_user' LIMIT 1);
SET @sql := IF(@idx IS NULL, 'SELECT 1', 'ALTER TABLE reclamation DROP INDEX idx_reclam_user');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT 1 FROM information_schema.statistics
             WHERE table_schema = DATABASE()
               AND table_name = 'reclamation'
               AND index_name = 'idx_reclam_status' LIMIT 1);
SET @sql := IF(@idx IS NULL, 'SELECT 1', 'ALTER TABLE reclamation DROP INDEX idx_reclam_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT 1 FROM information_schema.statistics
             WHERE table_schema = DATABASE()
               AND table_name = 'reclamation'
               AND index_name = 'idx_reclam_priority' LIMIT 1);
SET @sql := IF(@idx IS NULL, 'SELECT 1', 'ALTER TABLE reclamation DROP INDEX idx_reclam_priority');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT 1 FROM information_schema.statistics
             WHERE table_schema = DATABASE()
               AND table_name = 'reclamation'
               AND index_name = 'idx_rec_last_activity' LIMIT 1);
SET @sql := IF(@idx IS NULL, 'SELECT 1', 'ALTER TABLE reclamation DROP INDEX idx_rec_last_activity');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 3) Schema changes: make v2 structure match v1
-- ------------------------------------------------------------

-- Remove updated_at (exists in v2, not in v1)
-- Use dynamic SQL so it won't crash if already removed
SET @col := (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'reclamation'
    AND column_name = 'updated_at'
  LIMIT 1
);
SET @sql := IF(@col IS NULL, 'SELECT 1', 'ALTER TABLE reclamation DROP COLUMN updated_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add duplicate_count if missing
SET @col := (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'reclamation'
    AND column_name = 'duplicate_count'
  LIMIT 1
);
SET @sql := IF(
  @col IS NULL,
  'ALTER TABLE reclamation ADD COLUMN duplicate_count INT NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add risk_score if missing
SET @col := (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'reclamation'
    AND column_name = 'risk_score'
  LIMIT 1
);
SET @sql := IF(
  @col IS NULL,
  'ALTER TABLE reclamation ADD COLUMN risk_score DOUBLE NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Now adjust column types to match v1
ALTER TABLE reclamation
    MODIFY subject VARCHAR(150) NOT NULL,
    MODIFY description TINYTEXT NOT NULL,
    MODIFY status ENUM('OPEN','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL,
    MODIFY priority ENUM('LOW','MEDIUM','HIGH') NOT NULL,
    MODIFY created_at DATETIME(6) NOT NULL,
    MODIFY last_activity_at DATETIME(6) NULL,
    MODIFY resolved_at DATETIME(6) NULL;

-- ------------------------------------------------------------
-- 4) Recreate v1 indexes
-- ------------------------------------------------------------

CREATE INDEX idx_rec_user_status ON reclamation (user_id, status);
CREATE INDEX idx_rec_status      ON reclamation (status);
CREATE INDEX idx_rec_created     ON reclamation (created_at);

-- ------------------------------------------------------------
-- 5) Re-add FK (user_id -> user.user_id)
-- ------------------------------------------------------------

ALTER TABLE reclamation
    ADD CONSTRAINT reclamation_ibfk_1
        FOREIGN KEY (user_id) REFERENCES user(user_id)
            ON DELETE CASCADE;

COMMIT;