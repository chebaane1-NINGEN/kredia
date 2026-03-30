# 📚 Guide des Migrations - Kredia

## 🎯 Format des migrations

**Convention:** `YYYYMMDDHHmmss__description.sql`

**Exemples:**
- `20260206140000__initial_schema.sql` ✅
- `20260206150000__add_user_phone.sql` ✅
- `20260206153000__create_notifications_table.sql` ✅

## 🚀 Créer une nouvelle migration

### Étape 1 : Récupérer les dernières modifications
```bash
git pull
```

### Étape 2 : Créer la migration
```bash
create_migration.bat "description_de_la_migration"
```

### Étape 3 : Éditer le fichier créé
Le fichier est dans `src/main/resources/db/migration/`
    
**Exemple:**
```sql
-- Migration: add_user_phone
-- Created: 2026-02-06 15:30:00

ALTER TABLE user 
ADD COLUMN phone_number VARCHAR(20);

CREATE INDEX idx_user_phone ON user(phone_number);
```

### Étape 4 : Tester localement
```bash
mvnw spring-boot:run
```

### Étape 5 : Vérifier dans MySQL
```sql
USE kredia_db;
DESCRIBE user;  -- Voir la nouvelle colonne
SELECT * FROM flyway_schema_history;  -- Voir les migrations appliquées
```

### Étape 6 : Commiter
```bash
git add src/main/resources/db/migration/
git commit -m "migration: add user phone number"
git push
```

## 🔄 Workflow complet (exemple)

```bash
# 1. Modifier l'entité Java
# Ajouter dans User.java:
@Column(name = "phone_number", length = 20)
private String phoneNumber;

# 2. Créer la migration SQL
create_migration.bat "add_user_phone"

# 3. Éditer le fichier généré
# Ajouter: ALTER TABLE user ADD COLUMN phone_number VARCHAR(20);

# 4. Tester
mvnw spring-boot:run

# 5. Vérifier
# Ouvrir MySQL Workbench et vérifier la colonne

# 6. Commiter
git add .
git commit -m "feat: add phone number to user"
git push
```

## ⚠️ Règles IMPORTANTES

### ✅ À FAIRE
- Toujours faire `git pull` avant de créer une migration
- Tester localement avant de commiter
- Utiliser des noms descriptifs en anglais
- Ajouter des commentaires dans la migration
- Vérifier que la migration s'applique sans erreur

### ❌ À NE PAS FAIRE
- ❌ Ne JAMAIS modifier une migration déjà commitée
- ❌ Ne JAMAIS supprimer une migration appliquée
- ❌ Ne pas créer de migration sans tester
- ❌ Ne pas utiliser V1, V2, V3 (utiliser timestamps)

## 🔧 En cas de conflit

**Scénario:** Deux développeurs créent une migration en même temps

```
Dev 1: 20260206150000__add_user_phone.sql
Dev 2: 20260206150100__add_user_avatar.sql
```

✅ **Pas de problème !** Les deux migrations s'appliqueront automatiquement dans l'ordre chronologique.

Flyway est configuré avec `out-of-order=true` pour gérer ce cas.

## 📊 Vérifier l'état des migrations

```sql
-- Voir toutes les migrations appliquées
USE kredia_db;
SELECT 
    installed_rank,
    version,
    description,
    installed_on,
    success
FROM flyway_schema_history
ORDER BY installed_rank;
```

## 🆘 Dépannage

### Problème: Migration échoue

**Solution:**
1. Vérifier les logs dans la console
2. Corriger l'erreur SQL
3. Créer une NOUVELLE migration pour corriger (ne pas modifier l'ancienne)

```bash
# Si la migration 20260206150000__add_user_phone.sql échoue
# Créer une nouvelle migration:
create_migration.bat "fix_user_phone"
```

### Problème: Rollback nécessaire

**Solution:** Créer une migration inverse

```sql
-- 20260206160000__remove_user_phone.sql
ALTER TABLE user DROP COLUMN phone_number;
```

### Problème: Base de données désynchronisée

**Solution:** Réinitialiser (ATTENTION: Perte de données)

```bash
# 1. Sauvegarder si nécessaire
mysqldump -u root -p kredia_db > backup.sql

# 2. Supprimer et recréer
mysql -u root -p -e "DROP DATABASE kredia_db; CREATE DATABASE kredia_db;"

# 3. Relancer l'application
mvnw spring-boot:run
```

## 📝 Template de migration

```sql
-- =====================================================
-- Migration: [description]
-- Created: [date]
-- Author: [nom]
-- =====================================================

-- [Explication de ce que fait la migration]

-- Modification de structure
ALTER TABLE table_name 
ADD COLUMN column_name VARCHAR(255);

-- Index si nécessaire
CREATE INDEX idx_table_column ON table_name(column_name);

-- Données par défaut si nécessaire
UPDATE table_name SET column_name = 'default_value' WHERE column_name IS NULL;
```

## 🎓 Exemples courants

### Ajouter une colonne
```sql
ALTER TABLE user ADD COLUMN phone_number VARCHAR(20);
```

### Modifier une colonne
```sql
ALTER TABLE user MODIFY COLUMN email VARCHAR(255) NOT NULL;
```

### Ajouter un index
```sql
CREATE INDEX idx_user_email ON user(email);
```

### Créer une table
```sql
CREATE TABLE notification (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Ajouter une clé étrangère
```sql
ALTER TABLE order_table
ADD CONSTRAINT fk_order_user
FOREIGN KEY (user_id) REFERENCES user(user_id);
```

## 📱 Commandes utiles

```bash
# Créer une migration
create_migration.bat "description"

# Lancer l'application (applique les migrations)
mvnw spring-boot:run

# Compiler sans tests
mvnw clean install -DskipTests

# Voir l'état Git
git status

# Récupérer les dernières migrations
git pull
```

---

**💡 Conseil:** Gardez ce guide ouvert pendant vos développements !
