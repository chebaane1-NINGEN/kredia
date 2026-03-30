# Kredia - Projet Spring Boot

## Description
Projet Spring Boot vierge avec Maven et Lombok.

## Prérequis
- Java 17 ou supérieur
- Maven 3.6+ (ou utiliser le wrapper Maven inclus)

## Technologies utilisées
- Spring Boot 3.2.2
- Maven
- Lombok
- Spring Web
- Spring DevTools
- Spring Data JPA
- MySQL
- Flyway (migrations)
- Brevo API (emails transactionnels)
- Cloudinary (stockage d'images)
- Hedera SDK (blockchain)
- Google Gemini AI
- Alpha Vantage API (données de marché)

## Installation

### Cloner le projet
```bash
git clone <url-du-repo>
cd kredia
```

### Compiler le projet
```bash
mvn clean install
```

### Lancer l'application
```bash
mvn spring-boot:run
```

L'application démarrera sur http://localhost:8080

## Structure du projet
```
kredia/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/kredia/
│   │   │       └── KrediaApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/
│           └── com/kredia/
│               └── KrediaApplicationTests.java
├── pom.xml
└── README.md
```

## Configuration Lombok dans l'IDE

### IntelliJ IDEA
1. Installer le plugin Lombok (File > Settings > Plugins)
2. Activer l'annotation processing (File > Settings > Build, Execution, Deployment > Compiler > Annotation Processors)

### VS Code
1. Installer l'extension "Language Support for Java"
2. Lombok sera automatiquement détecté via Maven

## Commandes Maven utiles

```bash
# Compiler le projet
mvn clean compile

# Lancer les tests
mvn test

# Créer un package JAR
mvn clean package

# Nettoyer le projet
mvn clean
```

## Portabilité
Ce projet peut être transféré sur n'importe quel PC avec Java 17+ et Maven installés. Tous les fichiers de configuration sont inclus.

## 📧 Configuration Email (Brevo)

Le système utilise **Brevo** (anciennement SendinBlue) pour l'envoi d'emails transactionnels.

### Guide rapide :
1. Créez un compte sur [Brevo](https://www.brevo.com/) (300 emails/jour gratuits)
2. Obtenez votre clé API dans Settings → SMTP & API
3. Configurez les variables d'environnement :
   ```bash
   export BREVO_API_KEY="votre-clé-api-brevo"
   export MAIL_FROM="noreply@kredia.com"
   ```

📖 Documentation complète : [BREVO_SETUP_GUIDE.md](BREVO_SETUP_GUIDE.md)

## 📚 Documentation supplémentaire

- [EMAIL_NOTIFICATION_SETUP.md](EMAIL_NOTIFICATION_SETUP.md) - Configuration des notifications email
- [BREVO_SETUP_GUIDE.md](BREVO_SETUP_GUIDE.md) - Guide de démarrage Brevo
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Configuration de la base de données
- [MIGRATIONS_GUIDE.md](MIGRATIONS_GUIDE.md) - Guide des migrations Flyway
