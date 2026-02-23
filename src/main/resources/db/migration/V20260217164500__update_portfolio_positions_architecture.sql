-- Migration: Update portfolio positions to use asset_symbol instead of asset relationship
-- Created: 2026-02-17 16:45:00
-- Description: Refactor PortfolioPosition entity to store asset symbol directly
--              instead of maintaining a foreign key relationship with InvestmentAsset

-- Step 1: Add new asset_symbol column
ALTER TABLE portfolio_positions
ADD COLUMN asset_symbol VARCHAR(20) AFTER user_id;

-- Step 2: Migrate data from investment_asset to asset_symbol
-- For existing positions, copy the symbol from the related asset
UPDATE portfolio_positions pp
SET asset_symbol = (
    SELECT symbol FROM investment_assets ia 
    WHERE ia.asset_id = pp.asset_id
)
WHERE asset_symbol IS NULL AND asset_id IS NOT NULL;

-- Step 3: Drop the foreign key constraint
ALTER TABLE portfolio_positions 
DROP FOREIGN KEY fk_portfolio_asset;

-- Step 4: Drop the old asset_id column
ALTER TABLE portfolio_positions
DROP COLUMN asset_id;

-- Step 5: Make asset_symbol NOT NULL after migration
ALTER TABLE portfolio_positions
MODIFY COLUMN asset_symbol VARCHAR(20) NOT NULL;