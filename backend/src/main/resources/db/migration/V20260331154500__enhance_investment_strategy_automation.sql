ALTER TABLE investment_strategies
    ADD COLUMN risk_profile VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' AFTER stop_loss_pct,
    ADD COLUMN auto_create_orders TINYINT(1) NOT NULL DEFAULT 1 AFTER risk_profile,
    ADD COLUMN auto_create_positions TINYINT(1) NOT NULL DEFAULT 0 AFTER auto_create_orders,
    ADD COLUMN max_assets INT NOT NULL DEFAULT 5 AFTER auto_create_positions;

CREATE INDEX idx_strategy_risk_profile ON investment_strategies(risk_profile);
