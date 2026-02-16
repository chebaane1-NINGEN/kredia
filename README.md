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
