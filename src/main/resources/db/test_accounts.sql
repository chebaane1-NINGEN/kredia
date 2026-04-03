-- Insert specific test accounts for demo purposes
-- These are the accounts mentioned in the requirements

INSERT INTO `user` (
    user_id, first_name, last_name, email, phone_number, phone, password_hash, 
    role, status, deleted, email_verified, created_at, updated_at, version
) VALUES 
-- Main Admin (already exists as ID 1, but ensure password is correct)

-- Agent test accounts
(49, 'Agent', 'One', 'agent1@kredia.com', '+33611111111', '+33611111111', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 90 DAY), NOW(), 0),
(50, 'Agent', 'Two', 'agent2@kredia.com', '+33622222222', '+33622222222', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 85 DAY), NOW(), 0),

-- Client test accounts  
(51, 'Client', 'One', 'client1@email.com', '+33633333333', '+33633333333', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 60 DAY), NOW(), 0),
(52, 'Client', 'Two', 'client2@email.com', '+33644444444', '+33644444444', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 55 DAY), NOW(), 0)
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Assign clients to agents
UPDATE `user` SET assigned_agent_id = 49 WHERE user_id IN (51, 52);

-- Add activities for these test accounts
INSERT INTO user_activity (action_type, description, timestamp, user_id) VALUES
('CREATED', 'Test account created', NOW() - INTERVAL 90 DAY, 49),
('STATUS_CHANGED', 'Status changed to ACTIVE', NOW() - INTERVAL 89 DAY, 49),
('LOGIN', 'Agent logged in', NOW() - INTERVAL 1 HOUR, 49),
('CREATED', 'Test account created', NOW() - INTERVAL 85 DAY, 50),
('STATUS_CHANGED', 'Status changed to ACTIVE', NOW() - INTERVAL 84 DAY, 50),
('CLIENT_ASSIGNED', 'New client assigned', NOW() - INTERVAL 30 DAY, 49),
('CREATED', 'Test account created', NOW() - INTERVAL 60 DAY, 51),
('STATUS_CHANGED', 'Status changed to ACTIVE', NOW() - INTERVAL 59 DAY, 51),
('LOGIN', 'Client logged in', NOW() - INTERVAL 2 HOUR, 51),
('LOAN_APPLICATION', 'Submitted loan application', NOW() - INTERVAL 5 DAY, 51),
('CREATED', 'Test account created', NOW() - INTERVAL 55 DAY, 52),
('STATUS_CHANGED', 'Status changed to ACTIVE', NOW() - INTERVAL 54 DAY, 52),
('PROFILE_UPDATE', 'Updated profile information', NOW() - INTERVAL 10 DAY, 52)
ON DUPLICATE KEY UPDATE id=id;
