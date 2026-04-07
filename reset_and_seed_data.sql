-- Script de réinitialisation et re-seeding des données Kredia
-- Exécuter ce script pour vider la base et recréer les données de test

-- Désactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- Vider les tables dans le bon ordre
DELETE FROM user_activity;
DELETE FROM user;

-- Réactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- Réinitialiser les auto-incréments
ALTER TABLE user AUTO_INCREMENT = 1;
ALTER TABLE user_activity AUTO_INCREMENT = 1;

-- Afficher un message de confirmation
SELECT 'Database cleared successfully. Restart the application to trigger DataSeeder.' AS message;
