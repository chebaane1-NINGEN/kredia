-- Seed data for Kredia application
-- Insert default admin, agents, and clients

-- Note: Password hash is BCrypt encoded value of "password"
-- $2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm

INSERT INTO `user` (
    user_id, first_name, last_name, email, phone, phone_number, password_hash, 
    role, status, deleted, email_verified, created_at, updated_at, version
) VALUES 
-- Admin (ID: 1)
(1, 'Admin', 'Kredia', 'admin@kredia.com', '+21690000001', '+21690000001', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'ADMIN', 'ACTIVE', false, true, NOW(), NOW(), 0),

-- Agent 1 (ID: 2)
(2, 'Karim', 'Ben Ali', 'karim.agent@kredia.com', '+21690000002', '+21690000002', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, NOW(), NOW(), 0),

-- Agent 2 (ID: 3)
(3, 'Samira', 'Trabelsi', 'samira.agent@kredia.com', '+21690000003', '+21690000003', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, NOW(), NOW(), 0),

-- Client 1 (ID: 4) - assigned to Agent 1
(4, 'Mohamed', 'Hassan', 'mohamed.client@email.com', '+21690000004', '+21690000004', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, NOW(), NOW(), 0),

-- Client 2 (ID: 5) - assigned to Agent 1
(5, 'Fatima', 'Zahra', 'fatima.client@email.com', '+21690000005', '+21690000005', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, NOW(), NOW(), 0),

-- Client 3 (ID: 6) - assigned to Agent 2, pending
(6, 'Ahmed', 'Bouazizi', 'ahmed.client@email.com', '+21690000006', '+21690000006', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'PENDING_VERIFICATION', false, false, NOW(), NOW(), 0),

-- Client 4 (ID: 7) - suspended
(7, 'Nadia', 'Saidi', 'nadia.client@email.com', '+21690000007', '+21690000007', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'SUSPENDED', false, false, NOW(), NOW(), 0),

-- Client 5 (ID: 8) - blocked
(8, 'Ali', 'Gharbi', 'ali.client@email.com', '+21690000008', '+21690000008', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'BLOCKED', false, false, NOW(), NOW(), 0)
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Update client assignments
UPDATE `user` SET assigned_agent_id = 2 WHERE user_id IN (4, 5);
UPDATE `user` SET assigned_agent_id = 3 WHERE user_id = 6;

-- Insert sample activities for users
INSERT INTO user_activity (action_type, description, timestamp, user_id) VALUES
('CREATED', 'User account created', NOW() - INTERVAL 30 DAY, 1),
('STATUS_CHANGED', 'Status changed to ACTIVE by system', NOW() - INTERVAL 29 DAY, 1),
('CREATED', 'User account created', NOW() - INTERVAL 30 DAY, 2),
('STATUS_CHANGED', 'Status changed to ACTIVE by system', NOW() - INTERVAL 29 DAY, 2),
('APPROVAL', 'Approved loan application #1234', NOW() - INTERVAL 10 DAY, 2),
('CLIENT_HANDLED', 'Handled client request', NOW() - INTERVAL 5 DAY, 2),
('CREATED', 'User account created', NOW() - INTERVAL 30 DAY, 3),
('STATUS_CHANGED', 'Status changed to ACTIVE by system', NOW() - INTERVAL 29 DAY, 3),
('CREATED', 'User account created', NOW() - INTERVAL 30 DAY, 4),
('STATUS_CHANGED', 'Status changed to ACTIVE by system', NOW() - INTERVAL 29 DAY, 4),
('CREATED', 'User account created', NOW() - INTERVAL 30 DAY, 5),
('STATUS_CHANGED', 'Status changed to ACTIVE by system', NOW() - INTERVAL 29 DAY, 5),
('CREATED', 'User account created', NOW() - INTERVAL 30 DAY, 6),
('CREATED', 'User account created', NOW() - INTERVAL 30 DAY, 7),
('STATUS_CHANGED', 'Status changed to SUSPENDED by admin', NOW() - INTERVAL 15 DAY, 7),
('CREATED', 'User account created', NOW() - INTERVAL 30 DAY, 8),
('STATUS_CHANGED', 'Status changed to BLOCKED by admin', NOW() - INTERVAL 10 DAY, 8)
ON DUPLICATE KEY UPDATE id=id;
