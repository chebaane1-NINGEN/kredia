CREATE TABLE virtual_card (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    wallet_id BIGINT NOT NULL,
    card_number VARCHAR(16) NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    expiry_date VARCHAR(5) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (wallet_id) REFERENCES wallet(wallet_id) ON DELETE CASCADE
);
