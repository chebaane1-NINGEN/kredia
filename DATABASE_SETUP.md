# Configuration de la Base de Données - Kredia

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :
- **MySQL 8.0+** ou **MariaDB 10.6+**
- **Java 17+**
- **Maven 3.8+**

## 🚀 Installation Initiale (Pour les nouveaux développeurs)

### Étape 1 : Installer MySQL

#### Sur Windows :
1. Téléchargez MySQL depuis [mysql.com/downloads](https://dev.mysql.com/downloads/mysql/)
2. Installez MySQL avec les paramètres par défaut
3. Notez le mot de passe root défini pendant l'installation

#### Sur Linux :
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### Sur macOS :
```bash
brew install mysql
brew services start mysql
```

### Étape 2 : Créer la base de données

Connectez-vous à MySQL :
```bash
mysql -u root -p
```

Créez la base de données :
```sql
CREATE DATABASE kredia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

### Étape 3 : Configurer les paramètres de connexion

Ouvrez le fichier `src/main/resources/application.properties` et modifiez si nécessaire :

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/kredia_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=VOTRE_MOT_DE_PASSE
```

⚠️ **Important** : Ne commitez jamais vos mots de passe ! Créez un fichier `application-local.properties` pour vos configurations locales.

### Étape 4 : Installer les dépendances Maven

```bash
mvnw clean install
```

ou

```bash
./mvnw clean install
```

### Étape 5 : Lancer l'application

```bash
mvnw spring-boot:run
```

ou

```bash
./mvnw spring-boot:run
```

🎉 **Les tables seront créées automatiquement** lors du premier démarrage grâce à Flyway !

## 🔄 Système de Migration avec Flyway

### Comment ça marche ?

1. **Flyway** gère les migrations de base de données de manière versionnée
2. Les scripts SQL sont dans `src/main/resources/db/migration/`
3. Nommage : `V{version}__{description}.sql`
   - Exemple : `V1__initial_schema.sql`, `V2__add_user_preferences.sql`
4. Flyway exécute automatiquement les migrations au démarrage

### Structure des migrations

```
src/main/resources/
└── db/
    └── migration/
        ├── V1__initial_schema.sql       (✅ Déjà créé)
        ├── V2__add_new_features.sql     (Futures migrations)
        └── V3__update_indexes.sql       (Futures migrations)
```

### Ajouter une nouvelle migration

1. Créez un nouveau fichier SQL dans `src/main/resources/db/migration/`
2. Nommez-le avec la version suivante : `V2__description.sql`
3. Ajoutez vos instructions SQL :

```sql
-- V2__add_user_preferences.sql
ALTER TABLE user ADD COLUMN language VARCHAR(10) DEFAULT 'fr';
ALTER TABLE user ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
```

4. Redémarrez l'application - Flyway appliquera automatiquement la migration

## 🔍 Vérification de l'état des migrations

### Via MySQL :
```sql
USE kredia_db;
SELECT * FROM flyway_schema_history;
```

### Via l'application :
Les logs au démarrage affichent les migrations appliquées.

## 📊 Tables créées

La migration initiale `V1__initial_schema.sql` crée les tables suivantes :

### Gestion des utilisateurs
- `user` - Informations utilisateurs
- `kyc_document` - Documents KYC

### Gestion du portefeuille
- `wallet` - Portefeuilles
- `transaction` - Transactions
- `transaction_audit_log` - Audit des transactions

### Gestion des crédits
- `credit` - Crédits
- `echeance` - Échéances de paiement
- `kyc_loan` - Documents KYC pour les prêts

### Gestion des investissements
- `investment_strategy` - Stratégies d'investissement
- `investment_asset` - Actifs d'investissement
- `investment_order` - Ordres d'investissement
- `portfolio_position` - Positions du portefeuille

### Support client
- `reclamation` - Réclamations
- `reclamation_history` - Historique des réclamations
- `notification` - Notifications

## 🛠️ Commandes Utiles

### Réinitialiser la base de données (⚠️ ATTENTION : Supprime toutes les données)
```sql
DROP DATABASE kredia_db;
CREATE DATABASE kredia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Puis redémarrez l'application.

### Vérifier la structure d'une table
```sql
DESCRIBE user;
```

### Voir toutes les tables
```sql
SHOW TABLES;
```

### Exporter la structure (sans données)
```bash
mysqldump -u root -p --no-data kredia_db > schema_backup.sql
```

### Exporter la structure et les données
```bash
mysqldump -u root -p kredia_db > full_backup.sql
```

## 🔐 Bonnes Pratiques

1. **Ne jamais modifier directement la base de données en production**
2. **Toujours créer une migration pour tout changement de schéma**
3. **Tester les migrations sur un environnement local d'abord**
4. **Ne jamais modifier une migration déjà appliquée** - créer une nouvelle migration à la place
5. **Utiliser des noms descriptifs pour les migrations**
6. **Versionner les migrations avec Git**

## 🆘 Problèmes Courants

### Erreur : "Access denied for user 'root'@'localhost'"
- Vérifiez votre mot de passe dans `application.properties`
- Vérifiez que MySQL est démarré

### Erreur : "Unknown database 'kredia_db'"
- Créez la base de données manuellement (voir Étape 2)
- Ou utilisez `createDatabaseIfNotExist=true` dans l'URL

### Flyway échoue avec "Migration checksum mismatch"
- Ne modifiez jamais une migration déjà appliquée
- Solution : Créez une nouvelle migration pour corriger

### L'application ne démarre pas
- Vérifiez les logs dans la console
- Vérifiez que MySQL est accessible
- Vérifiez la configuration dans `application.properties`

## 📚 Ressources

- [Documentation Flyway](https://flywaydb.org/documentation/)
- [Spring Boot Data JPA](https://docs.spring.io/spring-boot/docs/current/reference/html/data.html#data.sql.jpa-and-spring-data)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## 👥 Pour les nouveaux développeurs

Voici les étapes rapides pour démarrer :

```bash
# 1. Cloner le projet
git clone <url-du-repo>
cd kredia

# 2. Créer la base de données MySQL
mysql -u root -p
CREATE DATABASE kredia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# 3. Configurer application.properties avec vos paramètres

# 4. Installer et lancer
./mvnw clean install
./mvnw spring-boot:run
```

C'est tout ! Les tables seront créées automatiquement. ✨
