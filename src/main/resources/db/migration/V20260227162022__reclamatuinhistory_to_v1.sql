START TRANSACTION;

-- 1. Modifier changed_at pour avoir microsecondes
ALTER TABLE reclamation_history
    MODIFY changed_at DATETIME(6) NOT NULL;

-- 2. Modifier new_status en ENUM
ALTER TABLE reclamation_history
    MODIFY new_status ENUM('OPEN','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL;

-- 3. Modifier old_status en ENUM
ALTER TABLE reclamation_history
    MODIFY old_status ENUM('OPEN','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL;

-- 4. Modifier la taille de note
ALTER TABLE reclamation_history
    MODIFY note VARCHAR(500) DEFAULT NULL;

-- 5. Supprimer la colonne changed_by
ALTER TABLE reclamation_history
DROP COLUMN changed_by;

-- 6. Ajouter user_id
ALTER TABLE reclamation_history
    ADD COLUMN user_id BIGINT NOT NULL AFTER old_status;

-- 7. Ajouter index sur changed_at
ALTER TABLE reclamation_history
    ADD INDEX idx_hist_changed (changed_at);

-- 8. Renommer index reclamation
ALTER TABLE reclamation_history
DROP INDEX idx_reclam_hist,
ADD INDEX idx_hist_reclamation (reclamation_id);

COMMIT;