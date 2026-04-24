-- =====================================================
-- Migration: create_demande_credit_table
-- Created: 2026-04-24
-- Description: Création de la table demande_credit
--              pour stocker les demandes de crédit
--              soumises par les clients avant validation
--              par un admin ou agent.
--              Lorsque la demande est approuvée, un crédit
--              officiel est créé et lié via credit_id.
-- =====================================================

CREATE TABLE IF NOT EXISTS demande_credit (
    id_demande_credit BIGINT         AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT         NOT NULL,
    credit_id         BIGINT         NULL,          -- rempli après approbation
    amount            FLOAT          NOT NULL,
    term_months       INT            NOT NULL,
    start_date        DATE           NOT NULL,
    end_date          DATE           NOT NULL,
    repayment_type    VARCHAR(50)    NOT NULL,
    income            DECIMAL(15, 2) NOT NULL,
    dependents        INT            NOT NULL DEFAULT 0,
    status            VARCHAR(50)    NOT NULL DEFAULT 'PENDING',
    created_at        DATETIME       NOT NULL,

    CONSTRAINT fk_demande_credit_user
        FOREIGN KEY (user_id)   REFERENCES `user`(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_demande_credit_credit
        FOREIGN KEY (credit_id) REFERENCES credit(credit_id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour accélérer les recherches courantes
CREATE INDEX idx_demande_credit_user_id   ON demande_credit(user_id);
CREATE INDEX idx_demande_credit_credit_id ON demande_credit(credit_id);
CREATE INDEX idx_demande_credit_status    ON demande_credit(status);
CREATE INDEX idx_demande_credit_created   ON demande_credit(created_at);
