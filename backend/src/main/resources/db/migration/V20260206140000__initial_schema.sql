-- =====================================================
-- Script de création initiale de la base de données Kredia
-- Basé sur la structure exacte des entités JPA
-- Version: 1.0
-- Date: 2026-02-06
-- =====================================================

-- =====================================================
-- Table: user (Module User)
-- =====================================================
CREATE TABLE user (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    cin VARCHAR(20) UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: kyc_document (Module User)
-- =====================================================
CREATE TABLE kyc_document (
    kyc_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    verified_at DATETIME,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: credit (Module Crédit)
-- =====================================================
CREATE TABLE credit (
    credit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    term_months INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    income DECIMAL(15,2),
    risk_score DECIMAL(5,2),
    created_at DATETIME NOT NULL,
    approved_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: echeance (Module Crédit)
-- =====================================================
CREATE TABLE echeance (
    echeance_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    credit_id BIGINT NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    paid_at DATETIME,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (credit_id) REFERENCES credit(credit_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: kyc_loan (Module Crédit)
-- =====================================================
CREATE TABLE kyc_loan (
    kyc_loan_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    credit_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_path VARCHAR(500) NOT NULL,
    uploaded_at DATETIME NOT NULL,
    FOREIGN KEY (credit_id) REFERENCES credit(credit_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: investment_assets (Module Investissement)
-- =====================================================
CREATE TABLE investment_assets (
    asset_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    asset_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: investment_strategies (Module Investissement)
-- =====================================================
CREATE TABLE investment_strategies (
    strategy_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    strategy_name VARCHAR(200) NOT NULL,
    max_budget DECIMAL(15,2),
    stop_loss_pct DECIMAL(5,2),
    reinvest_profits TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: investment_orders (Module Investissement)
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
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES investment_assets(asset_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: portfolio_positions (Module Investissement)
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
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES investment_assets(asset_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: notification (Module Support)
-- =====================================================
CREATE TABLE notification (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    read_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: reclamation (Module Support)
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
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: reclamation_history (Module Support)
-- =====================================================
CREATE TABLE reclamation_history (
    history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reclamation_id BIGINT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_at DATETIME NOT NULL,
    note VARCHAR(1000),
    changed_by VARCHAR(100),
    FOREIGN KEY (reclamation_id) REFERENCES reclamation(reclamation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: wallet (Module Wallet)
-- =====================================================
CREATE TABLE wallet (
    wallet_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    frozen_balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: transaction (Module Wallet)
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
    FOREIGN KEY (wallet_id) REFERENCES wallet(wallet_id) ON DELETE CASCADE,
    FOREIGN KEY (destination_wallet_id) REFERENCES wallet(wallet_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: transaction_audit_logs (Module Wallet)
-- =====================================================
CREATE TABLE transaction_audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    previous_hash VARCHAR(256),
    data_hash VARCHAR(256) NOT NULL,
    blockchain_tx_hash VARCHAR(256),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transaction(transaction_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Index pour améliorer les performances
-- =====================================================

-- Index sur user
CREATE INDEX idx_user_email ON user(email);
CREATE INDEX idx_user_phone ON user(phone);
CREATE INDEX idx_user_role ON user(role);

-- Index sur kyc_document
CREATE INDEX idx_kyc_user ON kyc_document(user_id);
CREATE INDEX idx_kyc_status ON kyc_document(status);

-- Index sur credit
CREATE INDEX idx_credit_user ON credit(user_id);
CREATE INDEX idx_credit_status ON credit(status);
CREATE INDEX idx_credit_created ON credit(created_at);

-- Index sur echeance
CREATE INDEX idx_echeance_credit ON echeance(credit_id);
CREATE INDEX idx_echeance_status ON echeance(status);
CREATE INDEX idx_echeance_due ON echeance(due_date);

-- Index sur kyc_loan
CREATE INDEX idx_kyc_loan_credit ON kyc_loan(credit_id);

-- Index sur investment_assets
CREATE INDEX idx_asset_symbol ON investment_assets(symbol);
CREATE INDEX idx_asset_category ON investment_assets(category);

-- Index sur investment_orders
CREATE INDEX idx_order_user ON investment_orders(user_id);
CREATE INDEX idx_order_asset ON investment_orders(asset_id);
CREATE INDEX idx_order_status ON investment_orders(order_status);
CREATE INDEX idx_order_created ON investment_orders(created_at);

-- Index sur investment_strategies
CREATE INDEX idx_strategy_user ON investment_strategies(user_id);
CREATE INDEX idx_strategy_active ON investment_strategies(is_active);

-- Index sur portfolio_positions
CREATE INDEX idx_position_user ON portfolio_positions(user_id);
CREATE INDEX idx_position_asset ON portfolio_positions(asset_id);

-- Index sur notification
CREATE INDEX idx_notif_user ON notification(user_id);
CREATE INDEX idx_notif_read ON notification(is_read);
CREATE INDEX idx_notif_type ON notification(type);

-- Index sur reclamation
CREATE INDEX idx_reclam_user ON reclamation(user_id);
CREATE INDEX idx_reclam_status ON reclamation(status);
CREATE INDEX idx_reclam_priority ON reclamation(priority);

-- Index sur reclamation_history
CREATE INDEX idx_reclam_hist ON reclamation_history(reclamation_id);

-- Index sur wallet
CREATE INDEX idx_wallet_user ON wallet(user_id);
CREATE INDEX idx_wallet_status ON wallet(status);

-- Index sur transaction
CREATE INDEX idx_trans_wallet ON transaction(wallet_id);
CREATE INDEX idx_trans_dest ON transaction(destination_wallet_id);
CREATE INDEX idx_trans_status ON transaction(status);
CREATE INDEX idx_trans_ref ON transaction(reference);
CREATE INDEX idx_trans_date ON transaction(transaction_date);

-- Index sur transaction_audit_logs
CREATE INDEX idx_audit_trans ON transaction_audit_logs(transaction_id);