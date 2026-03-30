-- =====================================================
-- Migration: remove_market_value_from_portfolio_positions
-- Created: 09/02/2026 11:36:28,58
-- Author: CW48P
-- =====================================================

-- TODO: Ajouter vos modifications SQL ici

-- Exemple:
-- ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
-- CREATE INDEX idx_users_phone ON users(phone_number);

ALTER TABLE portfolio_positions 
DROP COLUMN market_value;