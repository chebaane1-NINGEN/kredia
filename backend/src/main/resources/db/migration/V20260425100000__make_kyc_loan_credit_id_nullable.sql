-- Make credit_id nullable in kyc_loan to allow documents for pending applications
ALTER TABLE kyc_loan MODIFY credit_id BIGINT NULL DEFAULT NULL;
