-- Add demande_id column to kyc_loan to link documents to pending applications
ALTER TABLE kyc_loan ADD COLUMN demande_id BIGINT NULL DEFAULT NULL;
ALTER TABLE kyc_loan ADD CONSTRAINT fk_kyc_loan_demande FOREIGN KEY (demande_id) REFERENCES demande_credit(id_demande_credit);
