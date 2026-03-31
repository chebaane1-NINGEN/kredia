-- =====================================================
-- Flyway Repair Script for Kredia Database
-- Run this in MySQL to fix failed migration V20260331130000
-- =====================================================

-- Option 1: Mark the failed migration as successful (if columns were already added)
UPDATE flyway_schema_history 
SET success = 1, 
    checksum = -1415600365  -- New checksum after fixing the SQL file
WHERE version = '20260331130000';

-- Verify the fix
SELECT * FROM flyway_schema_history WHERE version = '20260331130000';
