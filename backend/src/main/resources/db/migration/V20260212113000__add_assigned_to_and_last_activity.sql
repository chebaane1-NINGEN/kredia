ALTER TABLE reclamation
    ADD COLUMN assigned_to BIGINT NULL,
  ADD COLUMN last_activity_at DATETIME NULL;

CREATE INDEX idx_rec_last_activity ON reclamation (last_activity_at);
