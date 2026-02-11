-- =====================================================
-- Migration: remove_updated_at_from_portfolio_positions
-- Created: 10/02/2026 14:40:03,91
-- Author: CW48P
-- =====================================================

-- TODO: Ajouter vos modifications SQL ici

-- Exemple:
-- ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
-- CREATE INDEX idx_users_phone ON users(phone_number);

ALTER TABLE portfolio_positions 
DROP COLUMN updated_at;