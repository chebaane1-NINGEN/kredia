-- V4: Create Core Business Tables (Credit, Wallet, Investment, Support)

-- =====================================================
-- Table: credit
-- =====================================================
CREATE TABLE credit (
    credit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount FLOAT NOT NULL,
    interest_rate FLOAT NOT NULL,
    term_months INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    income DECIMAL(15,2) NOT NULL,
    dependents INT NOT NULL,
    risk_level VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    decision_date DATETIME,
    handled_by BIGINT,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_credit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: echeance
-- =====================================================
CREATE TABLE echeance (
    echeance_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    credit_id BIGINT NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2),
    status VARCHAR(50) NOT NULL,
    paid_at DATETIME,
    CONSTRAINT fk_echeance_credit FOREIGN KEY (credit_id) REFERENCES credit(credit_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: kyc_loan
-- =====================================================
CREATE TABLE kyc_loan (
    kyc_loan_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    credit_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_path VARCHAR(150) NOT NULL,
    submitted_at DATETIME NOT NULL,
    verified_status VARCHAR(50) NOT NULL,
    CONSTRAINT fk_kyc_loan_credit FOREIGN KEY (credit_id) REFERENCES credit(credit_id) ON DELETE CASCADE,
    CONSTRAINT fk_kyc_loan_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: wallet
-- =====================================================
CREATE TABLE wallet (
    wallet_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    frozen_balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: transaction
-- =====================================================
CREATE TABLE transaction (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    wallet_id BIGINT NOT NULL,
    destination_wallet_id BIGINT,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reference VARCHAR(100) UNIQUE,
    description VARCHAR(500),
    transaction_date DATETIME NOT NULL,
    CONSTRAINT fk_transaction_wallet FOREIGN KEY (wallet_id) REFERENCES wallet(wallet_id) ON DELETE CASCADE,
    CONSTRAINT fk_transaction_dest FOREIGN KEY (destination_wallet_id) REFERENCES wallet(wallet_id) ON DELETE SET NULL
);

-- =====================================================
-- Table: transaction_audit_logs
-- =====================================================
CREATE TABLE transaction_audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    previous_hash VARCHAR(256),
    data_hash VARCHAR(256) NOT NULL,
    blockchain_tx_hash VARCHAR(256),
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_audit_transaction FOREIGN KEY (transaction_id) REFERENCES transaction(transaction_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: investment_assets
-- =====================================================
CREATE TABLE investment_assets (
    asset_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    asset_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL
);

-- =====================================================
-- Table: investment_strategies
-- =====================================================
CREATE TABLE investment_strategies (
    strategy_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    strategy_name VARCHAR(200) NOT NULL,
    max_budget DECIMAL(15,2),
    stop_loss_pct DECIMAL(5,2),
    reinvest_profits BOOLEAN NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    CONSTRAINT fk_strategy_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: investment_orders
-- =====================================================
CREATE TABLE investment_orders (
    order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    order_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(15,8) NOT NULL,
    price DECIMAL(15,2),
    order_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL,
    executed_at DATETIME,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_asset FOREIGN KEY (asset_id) REFERENCES investment_assets(asset_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: portfolio_positions
-- =====================================================
CREATE TABLE portfolio_positions (
    position_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    current_quantity DECIMAL(15,8) NOT NULL,
    avg_purchase_price DECIMAL(15,2) NOT NULL,
    market_value DECIMAL(15,2),
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    CONSTRAINT fk_position_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_position_asset FOREIGN KEY (asset_id) REFERENCES investment_assets(asset_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: notification
-- =====================================================
CREATE TABLE notification (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    read_at DATETIME,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: reclamation
-- =====================================================
CREATE TABLE reclamation (
    reclamation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    resolved_at DATETIME,
    CONSTRAINT fk_reclamation_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: reclamation_history
-- =====================================================
CREATE TABLE reclamation_history (
    history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reclamation_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_at DATETIME NOT NULL,
    note VARCHAR(1000),
    changed_by VARCHAR(100),
    CONSTRAINT fk_reclamation_history FOREIGN KEY (reclamation_id) REFERENCES reclamation(reclamation_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_credit_user ON credit(user_id);
CREATE INDEX idx_credit_status ON credit(status);
CREATE INDEX idx_echeance_credit ON echeance(credit_id);
CREATE INDEX idx_kyc_loan_credit ON kyc_loan(credit_id);
CREATE INDEX idx_wallet_user ON wallet(user_id);
