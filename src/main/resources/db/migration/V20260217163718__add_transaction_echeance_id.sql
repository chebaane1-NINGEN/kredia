-- 1️⃣ Ajouter la colonne si elle n'existe pas encore (pas UNSIGNED)
ALTER TABLE `transaction`
    ADD COLUMN `echeance_id` BIGINT ;

-- 2️⃣ Ajouter un index sur cette colonne (MySQL le recommande pour la FK)
ALTER TABLE `transaction`
    ADD INDEX `idx_transaction_echeance` (`echeance_id`);

-- 3️⃣ Ajouter la contrainte de clé étrangère
ALTER TABLE `transaction`
    ADD CONSTRAINT `fk_transaction_echeance`
        FOREIGN KEY (`echeance_id`) REFERENCES `echeance` (`echeance_id`)
            ON DELETE CASCADE;
