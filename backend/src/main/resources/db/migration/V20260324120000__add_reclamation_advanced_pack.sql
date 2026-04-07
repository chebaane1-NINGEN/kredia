ALTER TABLE reclamation
    MODIFY status ENUM('OPEN','IN_PROGRESS','WAITING_CUSTOMER','ESCALATED','REOPENED','RESOLVED','REJECTED') NOT NULL,
    ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'OTHER' AFTER priority,
    ADD COLUMN first_response_at DATETIME(6) NULL AFTER last_activity_at,
    ADD COLUMN first_response_due_at DATETIME(6) NULL AFTER first_response_at,
    ADD COLUMN resolution_due_at DATETIME(6) NULL AFTER first_response_due_at,
    ADD COLUMN customer_satisfaction_score INT NULL AFTER resolution_due_at,
    ADD COLUMN customer_feedback VARCHAR(500) NULL AFTER customer_satisfaction_score;

ALTER TABLE reclamation_history
    MODIFY old_status ENUM('OPEN','IN_PROGRESS','WAITING_CUSTOMER','ESCALATED','REOPENED','RESOLVED','REJECTED') NOT NULL,
    MODIFY new_status ENUM('OPEN','IN_PROGRESS','WAITING_CUSTOMER','ESCALATED','REOPENED','RESOLVED','REJECTED') NOT NULL,
    MODIFY user_id BIGINT NULL;

CREATE INDEX idx_rec_category ON reclamation (category);
CREATE INDEX idx_rec_first_response_due ON reclamation (first_response_due_at);
CREATE INDEX idx_rec_resolution_due ON reclamation (resolution_due_at);

CREATE TABLE reclamation_message (
    message_id BIGINT NOT NULL AUTO_INCREMENT,
    reclamation_id BIGINT NOT NULL,
    author_user_id BIGINT NOT NULL,
    visibility VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (message_id),
    KEY idx_msg_reclamation_created (reclamation_id, created_at),
    CONSTRAINT fk_msg_reclamation
        FOREIGN KEY (reclamation_id) REFERENCES reclamation(reclamation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE reclamation_attachment (
    attachment_id BIGINT NOT NULL AUTO_INCREMENT,
    reclamation_id BIGINT NOT NULL,
    uploaded_by_user_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    content_type VARCHAR(120) NULL,
    size_bytes BIGINT NULL,
    uploaded_at DATETIME(6) NOT NULL,
    PRIMARY KEY (attachment_id),
    KEY idx_att_reclamation_uploaded (reclamation_id, uploaded_at),
    CONSTRAINT fk_attachment_reclamation
        FOREIGN KEY (reclamation_id) REFERENCES reclamation(reclamation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
