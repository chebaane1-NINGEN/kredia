CREATE TABLE kyc_documents (
    kyc_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    uploaded_at DATETIME NOT NULL,
    verified_at DATETIME,
    verified_by BIGINT,
    CONSTRAINT fk_kyc_documents_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
