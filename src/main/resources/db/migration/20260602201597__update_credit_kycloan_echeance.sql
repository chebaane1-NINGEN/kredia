-- =====================================================
-- Migration: update_credit_echeance_kycloan
-- Created: 2026-02-06 22:30:00
-- Author: Youssef Mellouli
-- =====================================================

-- NOTE: Automatically commented out by system because these changes appear to already exist in the database
-- and were causing "Duplicate column" errors on startup.

-- ========================
-- Table: credit
-- ========================
-- Ajouter start_date, end_date, dependents
/*
ALTER TABLE credit
ADD COLUMN start_date DATE NOT NULL,
ADD COLUMN end_date DATE NOT NULL,
ADD COLUMN dependents INT;
*/

-- Supprimer risk_score
/*
ALTER TABLE credit
DROP COLUMN risk_score;
ALTER TABLE credit
DROP COLUMN approved_at;
*/

-- Modifier status pour ENUM
/*
ALTER TABLE credit
    MODIFY COLUMN status ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING';
*/

-- ========================
-- Table: echeance
-- ========================
-- Modifier status pour ENUM
/*
ALTER TABLE echeance
    MODIFY COLUMN status ENUM('PENDING','PAID','OVERDUE','PARTIALLY_PAID') NOT NULL DEFAULT 'PENDING';

ALTER TABLE echeance
DROP COLUMN created_at;
*/

-- ========================
-- Table: kyc_loan
-- ========================
-- Supprimer uploaded_at
/*
ALTER TABLE kyc_loan
DROP COLUMN uploaded_at;
*/

-- Ajouter user_id et verified_status
/*
ALTER TABLE kyc_loan
ADD COLUMN submitted_at NOT NULL,
ADD COLUMN user_id BIGINT NOT NULL,
ADD COLUMN verified_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING';
*/

-- Ajouter index pour user_id
/*
CREATE INDEX idx_kyc_loan_user ON kyc_loan(user_id);
*/

-- Ajouter clé étrangère user_id
/*
ALTER TABLE kyc_loan
    ADD CONSTRAINT fk_kyc_loan_user
        FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE;
*/
