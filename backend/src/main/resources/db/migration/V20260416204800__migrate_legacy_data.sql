-- ==============================================================================
-- SCRIPT DE MIGRATION SQL : DDL Schema Update + DML Data Insertion
-- ==============================================================================
-- 1. Met à jour le schéma de la base de données (Ajout des colonnes address, etc.)
-- 2. Convertit les types (ex: is_active -> status ENUM)
-- 3. Insère de façon statique les utilisateurs de l'ancienne version.

SET FOREIGN_KEY_CHECKS = 0;

-- ==============================================================================
-- 1. MISE A JOUR DE LA TABLE `user` (Génération des nouvelles colonnes)
-- ==============================================================================
ALTER TABLE `user`
ADD COLUMN `address` VARCHAR(255) DEFAULT NULL,
ADD COLUMN `created_by` VARCHAR(255) DEFAULT NULL,
ADD COLUMN `date_of_birth` DATE DEFAULT NULL,
ADD COLUMN `deleted` BIT(1) NOT NULL DEFAULT b'0',
ADD COLUMN `email_verified` BIT(1) NOT NULL DEFAULT b'0',
ADD COLUMN `failed_login_attempts` INT NOT NULL DEFAULT 0,
ADD COLUMN `gender` ENUM('MALE','FEMALE','OTHER') DEFAULT NULL,
ADD COLUMN `status` ENUM('ACTIVE','INACTIVE','BLOCKED','SUSPENDED','PENDING_VERIFICATION') NOT NULL DEFAULT 'PENDING_VERIFICATION',
ADD COLUMN `updated_at` DATETIME(6) DEFAULT NULL,
ADD COLUMN `updated_by` VARCHAR(255) DEFAULT NULL,
ADD COLUMN `verification_token` VARCHAR(255) DEFAULT NULL,
ADD COLUMN `version` BIGINT DEFAULT 0,
ADD COLUMN `assigned_agent_id` BIGINT DEFAULT NULL;

-- Conservation des anciennes données : Mapping boolean vers ENUM
UPDATE `user` SET `status` = IF(`is_active` = 1, 'ACTIVE', 'INACTIVE'), `role` = UPPER(`role`);

-- Suppression des anciennes colonnes obsolètes et conversion des types
ALTER TABLE `user` DROP COLUMN `is_active`;
ALTER TABLE `user` DROP COLUMN `cin`;
ALTER TABLE `user` MODIFY COLUMN `role` ENUM('ADMIN','AGENT','CLIENT') NOT NULL;
ALTER TABLE `user` MODIFY COLUMN `created_at` DATETIME(6) NOT NULL;

-- ==============================================================================
-- 2. MISE A JOUR DE LA TABLE `kyc_document`
-- ==============================================================================
UPDATE `kyc_document` SET `document_type` = UPPER(`document_type`), `status` = UPPER(`status`);

ALTER TABLE `kyc_document` 
MODIFY COLUMN `file_path` VARCHAR(255) NOT NULL,
MODIFY COLUMN `document_type` ENUM('CIN','SIGNATURE','INCOME_PROOF','BANK_STATEMENT','TAX_RETURN','EMPLOYMENT_CONTRACT') NOT NULL,
MODIFY COLUMN `status` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
MODIFY COLUMN `created_at` DATETIME(6) NOT NULL,
MODIFY COLUMN `verified_at` DATETIME(6) DEFAULT NULL;

-- ==============================================================================
-- 3. CREATION DE LA TABLE `user_activity`
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `user_activity` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `action_type` VARCHAR(50) NOT NULL,
  `description` VARCHAR(500) NOT NULL,
  `timestamp` DATETIME(6) NOT NULL,
  `user_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 4. INSERTION DES ANCIENS UTILISATEURS (Extraits de kredia_db (1).sql)
-- ==============================================================================
INSERT IGNORE INTO `user` (
    `user_id`, `address`, `created_at`, `created_by`, `date_of_birth`, 
    `deleted`, `email`, `email_verified`, `failed_login_attempts`, 
    `first_name`, `gender`, `last_name`, `password_hash`, `phone`, 
    `role`, `status`, `updated_at`, `updated_by`, `verification_token`, 
    `version`, `assigned_agent_id`
) VALUES 
(
    1, NULL, '2026-02-28 00:49:19', 'SYSTEM_MIGRATION', NULL, 
    b'0', 'rhthry', b'1', 0, 
    'tgrth', NULL, 'rhyr', 'rhyh', '90207720', 
    'ADMIN', 'ACTIVE', '2026-02-28 00:49:19', 'SYSTEM_MIGRATION', NULL, 
    0, NULL
),
(
    2, NULL, '2026-03-28 19:01:03', 'SYSTEM_MIGRATION', NULL, 
    b'0', 'mellouli.youssef11@gmail.com', b'1', 0, 
    'th', NULL, 'tyhty', 'fregrtgh', '98207720', 
    'ADMIN', 'ACTIVE', '2026-03-28 19:01:03', 'SYSTEM_MIGRATION', NULL, 
    0, NULL
);

INSERT IGNORE INTO `user_activity` (
    `action_type`, `description`, `timestamp`, `user_id`
) VALUES 
('MIGRATION_SYSTEM', 'Historique généré suite à la migration du système depuis l''ancienne base.', NOW(), 1),
('MIGRATION_SYSTEM', 'Historique généré suite à la migration du système depuis l''ancienne base.', NOW(), 2);

-- ==============================================================================
-- 5. REINITIALISATION DES AUTO_INCREMENTS
-- ==============================================================================
ALTER TABLE `user` AUTO_INCREMENT = 10;
ALTER TABLE `kyc_document` AUTO_INCREMENT = 10;
ALTER TABLE `user_activity` AUTO_INCREMENT = 10;

SET FOREIGN_KEY_CHECKS = 1;
