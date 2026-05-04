Kredia – Projet Spring Boot
Overview

Ce projet a été développé dans le cadre du PIDEV – ᵉ année du cycle ingénieur à Esprit School of Engineering (Année académique 2026-2027).
Il s'agit d'une application back-end Spring Boot complète pour la gestion de microcrédits, intégrant des fonctionnalités avancées telles que l’envoi d’emails transactionnels, le stockage cloud d’images, l’accès à des données financières externes et l’intégration d’IA via Google Gemini.

Tech Stack
Backend : Spring Boot 3.2.2, Maven, Lombok
Base de données : MySQL avec Spring Data JPA et Flyway pour les migrations
Services externes : Brevo (emails transactionnels), Cloudinary (stockage d’images), Hedera SDK (blockchain), Google Gemini AI, Alpha Vantage API (données financières)
Dev Tools : Spring DevTools
Academic Context

Développé à Esprit School of Engineering, ce projet vise à :

Créer une architecture Spring Boot robuste et modulaire
Intégrer des API externes pour enrichir l’application
Assurer la portabilité et la maintenabilité du code
Description

Projet Spring Boot vierge avec Maven et Lombok, prêt à accueillir des modules métiers (crédits, utilisateurs, transactions, notifications, etc.).

Prérequis
Java 17 ou supérieur
Maven 3.6+ (ou wrapper Maven inclus)
MySQL installé et configuré
Installation
Cloner le projet
git clone <url-du-repo>
cd kredia
Compiler le projet
mvn clean install
Lancer l'application
mvn spring-boot:run

L'application démarrera sur http://localhost:8080

Structure du projet
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
Configuration Lombok dans l'IDE
IntelliJ IDEA
Installer le plugin Lombok (File > Settings > Plugins)
Activer l’annotation processing (File > Settings > Build, Execution, Deployment > Compiler > Annotation Processors)
VS Code
Installer l’extension Language Support for Java
Lombok sera automatiquement détecté via Maven
Commandes Maven utiles
# Compiler le projet
mvn clean compile

# Lancer les tests
mvn test

# Créer un package JAR
mvn clean package

# Nettoyer le projet
mvn clean
Portabilité

Le projet peut être exécuté sur n’importe quel poste avec Java 17+ et Maven installés.
Toutes les configurations nécessaires sont incluses dans le dépôt.

📧 Configuration Email (Brevo)

Le système utilise Brevo pour l’envoi d’emails transactionnels.

Guide rapide
Créez un compte sur Brevo
 (300 emails/jour gratuits)
Obtenez votre clé API dans Settings → SMTP & API
Configurez les variables d’environnement :
export BREVO_API_KEY="votre-clé-api-brevo"
export MAIL_FROM="noreply@kredia.com"

📖 Documentation complète : BREVO_SETUP_GUIDE.md

📚 Documentation supplémentaire
EMAIL_NOTIFICATION_SETUP.md
 - Configuration des notifications email
BREVO_SETUP_GUIDE.md
 - Guide de démarrage Brevo
DATABASE_SETUP.md
 - Configuration de la base de données
MIGRATIONS_GUIDE.md
 - Guide des migrations Flyway
