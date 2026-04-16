-- Add messages table for admin-agent communication
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content VARCHAR(1000) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_receiver (receiver_id),
    INDEX idx_messages_timestamp (timestamp),
    FOREIGN KEY (sender_id) REFERENCES user(user_id),
    FOREIGN KEY (receiver_id) REFERENCES user(user_id)
);

-- Add profile_picture_url column to user table
ALTER TABLE user ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);

-- Add indexes for better performance on user_activity
CREATE INDEX IF NOT EXISTS idx_user_activity_target_user ON user_activity(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action_type ON user_activity(action_type);