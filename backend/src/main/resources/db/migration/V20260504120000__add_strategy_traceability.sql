-- Add strategy_id column to investment_orders for traceability
ALTER TABLE investment_orders 
ADD COLUMN strategy_id BIGINT NULL;

-- Add foreign key constraint
ALTER TABLE investment_orders 
ADD CONSTRAINT fk_investment_orders_strategy 
FOREIGN KEY (strategy_id) REFERENCES investment_strategies(strategy_id) 
ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_investment_orders_strategy_id 
ON investment_orders(strategy_id);

-- Add strategy_id column to portfolio_positions for traceability
ALTER TABLE portfolio_positions 
ADD COLUMN strategy_id BIGINT NULL;

-- Add foreign key constraint
ALTER TABLE portfolio_positions 
ADD CONSTRAINT fk_portfolio_positions_strategy 
FOREIGN KEY (strategy_id) REFERENCES investment_strategies(strategy_id) 
ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_portfolio_positions_strategy_id 
ON portfolio_positions(strategy_id);
