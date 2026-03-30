-- Migration to fix transaction inheritance and add missing columns for TransactionLoan
ALTER TABLE transaction ADD COLUMN dtype VARCHAR(31) NOT NULL DEFAULT 'TRANSACTION' AFTER transaction_id;
ALTER TABLE transaction ADD COLUMN echeance_id BIGINT;
ALTER TABLE transaction ADD CONSTRAINT fk_transaction_echeance FOREIGN KEY (echeance_id) REFERENCES echeance(echeance_id);

-- Optional: Update existing records to have 'TRANSACTION' as dtype
UPDATE transaction SET dtype = 'TRANSACTION' WHERE dtype IS NULL;
