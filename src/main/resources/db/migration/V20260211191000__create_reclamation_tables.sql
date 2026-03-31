CREATE TABLE IF NOT EXISTS reclamation (
                                           reclamation_id BIGINT NOT NULL AUTO_INCREMENT,
                                           user_id BIGINT NOT NULL,
                                           subject VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(30) NOT NULL,
    risk_score DOUBLE NULL,
    created_at DATETIME NOT NULL,
    resolved_at DATETIME NULL,
    PRIMARY KEY (reclamation_id),
    KEY idx_rec_user_status (user_id, status),
    KEY idx_rec_status (status),
    KEY idx_rec_created (created_at),
    CONSTRAINT fk_rec_user
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS reclamation_history (
                                                   history_id BIGINT NOT NULL AUTO_INCREMENT,
                                                   reclamation_id BIGINT NOT NULL,
                                                   user_id BIGINT NOT NULL,
                                                   old_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    changed_at DATETIME NOT NULL,
    note TEXT NULL,
    PRIMARY KEY (history_id),
    KEY idx_hist_reclamation (reclamation_id),
    KEY idx_hist_changed (changed_at),
    CONSTRAINT fk_hist_reclamation
    FOREIGN KEY (reclamation_id) REFERENCES reclamation(reclamation_id) ON DELETE CASCADE,
    CONSTRAINT fk_hist_user
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS notification (
                                            notification_id BIGINT NOT NULL AUTO_INCREMENT,
                                            user_id BIGINT NOT NULL,
                                            reclamation_id BIGINT NULL,
                                            type VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    sent_at DATETIME NOT NULL,
    PRIMARY KEY (notification_id),
    KEY idx_notif_user_read (user_id, is_read),
    KEY idx_notif_sent (sent_at),
    CONSTRAINT fk_notif_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_reclamation
    FOREIGN KEY (reclamation_id) REFERENCES reclamation(reclamation_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
