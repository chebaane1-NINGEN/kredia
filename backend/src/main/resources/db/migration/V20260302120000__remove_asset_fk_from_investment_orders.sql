-- =====================================================
-- Suppression de la dépendance à investment_assets
-- dans la table investment_orders.
-- Remplacement de asset_id (FK) par asset_symbol (String).
-- =====================================================
-- Désactiver les vérifications de clés étrangères pour éviter les erreurs lors de la modification de la table
ALTER TABLE investment_orders
    DROP FOREIGN KEY investment_orders_ibfk_2;

ALTER TABLE investment_orders
    DROP COLUMN asset_id,
    ADD COLUMN asset_symbol VARCHAR(20) NOT NULL DEFAULT '' AFTER user_id;

CREATE INDEX idx_order_asset_symbol ON investment_orders(asset_symbol);
