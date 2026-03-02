# Utiliser une image Python officielle
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système nécessaires pour MySQL
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copier le fichier des dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY main.py .

# Exposer le port
EXPOSE 8002

# Variables d'environnement par défaut
ENV DATABASE_URL="mysql+pymysql://root:Ningen@2024@host.docker.internal:3306/kredia_db"
ENV ALPHA_VANTAGE_API_KEY="ACH9TF7OZXXUFNH0"
ENV MONITORING_INTERVAL="60"

# Commande de démarrage
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]
