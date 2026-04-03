-- Seed data for Kredia application - Realistic user data
-- 40+ users with varied roles, statuses, and realistic data

-- Note: Password hash is BCrypt encoded value of "password"
-- $2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm

-- Clear existing data
DELETE FROM user_activity WHERE user_id > 8;
DELETE FROM `user` WHERE user_id > 8;

-- Insert realistic users
INSERT INTO `user` (
    user_id, first_name, last_name, email, phone_number, phone, password_hash, 
    role, status, deleted, email_verified, created_at, updated_at, version
) VALUES 

-- ADMIN USERS (3)
(9, 'Thomas', 'Dubois', 'thomas.dubois@kredia.com', '+33612345609', '+33612345609', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'ADMIN', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 365 DAY), NOW(), 0),
(10, 'Marie', 'Leroy', 'marie.leroy@kredia.com', '+33612345610', '+33612345610', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'ADMIN', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 280 DAY), NOW(), 0),
(11, 'Pierre', 'Martin', 'pierre.martin@kredia.com', '+33612345611', '+33612345611', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'ADMIN', 'SUSPENDED', false, true, DATE_SUB(NOW(), INTERVAL 180 DAY), NOW(), 0),

-- AGENT USERS (15)
(12, 'Sophie', 'Bernard', 'sophie.bernard@kredia.com', '+33612345612', '+33612345612', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 240 DAY), NOW(), 0),
(13, 'Nicolas', 'Petit', 'nicolas.petit@kredia.com', '+33612345613', '+33612345613', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 200 DAY), NOW(), 0),
(14, 'Camille', 'Rousseau', 'camille.rousseau@kredia.com', '+33612345614', '+33612345614', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 160 DAY), NOW(), 0),
(15, 'Julie', 'Fournier', 'julie.fournier@kredia.com', '+33612345615', '+33612345615', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'BLOCKED', false, true, DATE_SUB(NOW(), INTERVAL 120 DAY), NOW(), 0),
(16, 'David', 'Garcia', 'david.garcia@kredia.com', '+33612345616', '+33612345616', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 90 DAY), NOW(), 0),
(17, 'Laura', 'Lopez', 'laura.lopez@kredia.com', '+33612345617', '+33612345617', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'INACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 60 DAY), NOW(), 0),
(18, 'Antoine', 'Moreau', 'antoine.moreau@kredia.com', '+33612345618', '+33612345618', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 300 DAY), NOW(), 0),
(19, 'Emma', 'Laurent', 'emma.laurent@kredia.com', '+33612345619', '+33612345619', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 270 DAY), NOW(), 0),
(20, 'Lucas', 'Simon', 'lucas.simon@kredia.com', '+33612345620', '+33612345620', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'SUSPENDED', false, true, DATE_SUB(NOW(), INTERVAL 45 DAY), NOW(), 0),
(21, 'Chloé', 'Michel', 'chloe.michel@kredia.com', '+33612345621', '+33612345621', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 210 DAY), NOW(), 0),
(22, 'Hugo', 'Robert', 'hugo.robert@kredia.com', '+33612345622', '+33612345622', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 150 DAY), NOW(), 0),
(23, 'Alice', 'Richard', 'alice.richard@kredia.com', '+33612345623', '+33612345623', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'BLOCKED', false, true, DATE_SUB(NOW(), INTERVAL 30 DAY), NOW(), 0),
(24, 'Mathieu', 'Durand', 'mathieu.durand@kredia.com', '+33612345624', '+33612345624', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 180 DAY), NOW(), 0),
(25, 'Léa', 'Lefebvre', 'lea.lefebvre@kredia.com', '+33612345625', '+33612345625', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'INACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 90 DAY), NOW(), 0),
(26, 'Nathan', 'Mercier', 'nathan.mercier@kredia.com', '+33612345626', '+33612345626', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'AGENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 330 DAY), NOW(), 0),

-- CLIENT USERS (25)
(27, 'Mohamed', 'Benali', 'mohamed.benali@email.com', '+33612345627', '+33612345627', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 350 DAY), NOW(), 0),
(28, 'Fatima', 'Zahra', 'fatima.zahra@email.com', '+33612345628', '+33612345628', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 320 DAY), NOW(), 0),
(29, 'Ahmed', 'Bouazizi', 'ahmed.bouazizi@email.com', '+33612345629', '+33612345629', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'PENDING_VERIFICATION', false, false, DATE_SUB(NOW(), INTERVAL 7 DAY), NOW(), 0),
(30, 'Nadia', 'Saidi', 'nadia.saidi@email.com', '+33612345630', '+33612345630', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'SUSPENDED', false, true, DATE_SUB(NOW(), INTERVAL 60 DAY), NOW(), 0),
(31, 'Ali', 'Gharbi', 'ali.gharbi@email.com', '+33612345631', '+33612345631', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'BLOCKED', false, true, DATE_SUB(NOW(), INTERVAL 30 DAY), NOW(), 0),
(32, 'Youssef', 'Khalil', 'youssef.khalil@email.com', '+33612345632', '+33612345632', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 280 DAY), NOW(), 0),
(33, 'Amina', 'Tounsi', 'amina.tounsi@email.com', '+33612345633', '+33612345633', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 250 DAY), NOW(), 0),
(34, 'Karim', 'Mansour', 'karim.mansour@email.com', '+33612345634', '+33612345634', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'INACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 180 DAY), NOW(), 0),
(35, 'Samira', 'Trabelsi', 'samira.trabelsi@email.com', '+33612345635', '+33612345635', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 220 DAY), NOW(), 0),
(36, 'Omar', 'Belhadj', 'omar.belhadj@email.com', '+33612345636', '+33612345636', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'PENDING_VERIFICATION', false, false, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW(), 0),
(37, 'Leila', 'Hammami', 'leila.hammami@email.com', '+33612345637', '+33612345637', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 200 DAY), NOW(), 0),
(38, 'Rachid', 'Brahim', 'rachid.brahim@email.com', '+33612345638', '+33612345638', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'BLOCKED', false, true, DATE_SUB(NOW(), INTERVAL 15 DAY), NOW(), 0),
(39, 'Meryem', 'Jaziri', 'meryem.jaziri@email.com', '+33612345639', '+33612345639', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'SUSPENDED', false, true, DATE_SUB(NOW(), INTERVAL 90 DAY), NOW(), 0),
(40, 'Sami', 'Benromdhane', 'sami.benromdhane@email.com', '+33612345640', '+33612345640', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 170 DAY), NOW(), 0),
(41, 'Imen', 'Kallel', 'imen.kallel@email.com', '+33612345641', '+33612345641', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'INACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 120 DAY), NOW(), 0),
(42, 'Walid', 'Mansour', 'walid.mansour@email.com', '+33612345642', '+33612345642', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 150 DAY), NOW(), 0),
(43, 'Rania', 'Cherif', 'rania.cherif@email.com', '+33612345643', '+33612345643', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'PENDING_VERIFICATION', false, false, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), 0),
(44, 'Bilel', 'Sassi', 'bilel.sassi@email.com', '+33612345644', '+33612345644', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 140 DAY), NOW(), 0),
(45, 'Sarra', 'Gharbi', 'sarra.gharbi@email.com', '+33612345645', '+33612345645', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'BLOCKED', false, true, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), 0),
(46, 'Anis', 'Jaballah', 'anis.jaballah@email.com', '+33612345646', '+33612345646', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 130 DAY), NOW(), 0),
(47, 'Wiem', 'Hamza', 'wiem.hamza@email.com', '+33612345647', '+33612345647', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'INACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 80 DAY), NOW(), 0),
(48, 'Tarek', 'Ben', 'tarek.ben@email.com', '+33612345648', '+33612345648', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKj3QGz3v9R3I0kQm', 'CLIENT', 'ACTIVE', false, true, DATE_SUB(NOW(), INTERVAL 110 DAY), NOW(), 0)
ON DUPLICATE KEY UPDATE user_id=user_id;

-- Update client assignments (distribute among agents)
UPDATE `user` SET assigned_agent_id = 12 WHERE user_id IN (27, 28, 32, 33, 44);
UPDATE `user` SET assigned_agent_id = 13 WHERE user_id IN (35, 40, 42, 46, 48);
UPDATE `user` SET assigned_agent_id = 14 WHERE user_id IN (30, 37, 39, 47);
UPDATE `user` SET assigned_agent_id = 16 WHERE user_id IN (34, 41, 45);
UPDATE `user` SET assigned_agent_id = 18 WHERE user_id IN (31, 36, 38, 43);

-- Insert realistic user activities
INSERT INTO user_activity (action_type, description, timestamp, user_id) VALUES
-- Recent activities (last 30 days)
('LOGIN', 'User logged into platform', NOW() - INTERVAL 1 HOUR, 27),
('PROFILE_UPDATE', 'Updated phone number', NOW() - INTERVAL 3 HOUR, 27),
('DOCUMENT_UPLOAD', 'Uploaded KYC documents', NOW() - INTERVAL 5 HOUR, 27),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 2 HOUR, 28),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 6 HOUR, 32),
('LOAN_APPLICATION', 'Submitted loan application for €5,000', NOW() - INTERVAL 12 HOUR, 32),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 1 DAY, 33),
('PROFILE_UPDATE', 'Changed address', NOW() - INTERVAL 2 DAY, 33),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 3 DAY, 34),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 4 HOUR, 35),
('PROFILE_UPDATE', 'Updated email preferences', NOW() - INTERVAL 8 HOUR, 35),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 30 MINUTE, 36),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 2 HOUR, 37),
('DOCUMENT_UPLOAD', 'Uploaded identity document', NOW() - INTERVAL 4 HOUR, 37),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 1 DAY, 38),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 6 HOUR, 39),
('PROFILE_UPDATE', 'Updated contact information', NOW() - INTERVAL 12 HOUR, 39),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 3 HOUR, 40),
('LOAN_APPLICATION', 'Submitted loan application for €10,000', NOW() - INTERVAL 1 DAY, 40),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 5 HOUR, 41),
('DOCUMENT_UPLOAD', 'Uploaded proof of address', NOW() - INTERVAL 8 HOUR, 41),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 2 DAY, 42),
('PROFILE_UPDATE', 'Changed phone number', NOW() - INTERVAL 3 DAY, 42),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 1 HOUR, 43),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 4 HOUR, 44),
('PROFILE_UPDATE', 'Updated personal information', NOW() - INTERVAL 6 HOUR, 44),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 30 MINUTE, 45),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 2 HOUR, 46),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 1 DAY, 47),
('PROFILE_UPDATE', 'Updated notification settings', NOW() - INTERVAL 2 DAY, 47),
('LOGIN', 'User logged into platform', NOW() - INTERVAL 3 HOUR, 48),
('LOAN_APPLICATION', 'Submitted loan application for €7,500', NOW() - INTERVAL 5 HOUR, 48),

-- Admin activities
('USER_CREATED', 'Created new user account', NOW() - INTERVAL 1 DAY, 9),
('USER_STATUS_CHANGED', 'Activated user account', NOW() - INTERVAL 1 DAY, 9),
('ROLE_CHANGED', 'Changed user role to AGENT', NOW() - INTERVAL 2 DAY, 9),
('USER_CREATED', 'Created new user account', NOW() - INTERVAL 3 DAY, 10),
('USER_DELETED', 'Soft deleted user account', NOW() - INTERVAL 5 DAY, 10),
('USER_RESTORED', 'Restored previously deleted user', NOW() - INTERVAL 6 DAY, 10),

-- Agent activities
('CLIENT_ASSIGNED', 'New client assigned to agent', NOW() - INTERVAL 1 DAY, 12),
('CLIENT_HANDLED', 'Completed client verification', NOW() - INTERVAL 2 DAY, 12),
('APPROVAL', 'Approved loan application #1234', NOW() - INTERVAL 3 DAY, 12),
('CLIENT_ASSIGNED', 'New client assigned to agent', NOW() - INTERVAL 1 DAY, 13),
('CLIENT_HANDLED', 'Reviewed client documents', NOW() - INTERVAL 2 DAY, 13),
('APPROVAL', 'Approved loan application #5678', NOW() - INTERVAL 4 DAY, 13)
ON DUPLICATE KEY UPDATE id=id;
