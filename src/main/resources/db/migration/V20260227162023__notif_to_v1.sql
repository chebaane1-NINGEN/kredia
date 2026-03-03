START TRANSACTION;

-- modifier colonnes
ALTER TABLE notification
    MODIFY is_read BIT(1) NOT NULL;

ALTER TABLE notification
    MODIFY message TINYTEXT NOT NULL;

ALTER TABLE notification
    MODIFY title VARCHAR(150) NOT NULL;

ALTER TABLE notification
    MODIFY type ENUM('SMS','EMAIL','PUSH') NOT NULL;

-- renommer created_at -> sent_at
ALTER TABLE notification
    CHANGE created_at sent_at DATETIME NOT NULL;

-- supprimer read_at
ALTER TABLE notification
DROP COLUMN read_at;

-- ajouter reclamation_id
ALTER TABLE notification
    ADD COLUMN reclamation_id BIGINT NULL AFTER message;

-- supprimer anciens index (sauf idx_notif_user)
ALTER TABLE notification
DROP INDEX idx_notif_read,
DROP INDEX idx_notif_type;

-- nouveaux index
ALTER TABLE notification
    ADD INDEX idx_notif_user_read (user_id, is_read),
ADD INDEX idx_notif_sent (sent_at);

COMMIT;