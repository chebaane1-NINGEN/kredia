-- Migration to make transaction_id nullable in transaction_audit_logs
-- This allows auditing actions that are not directly tied to a specific transaction (like Wallet creation or Profile updates)

ALTER TABLE transaction_audit_logs MODIFY transaction_id BIGINT NULL;
