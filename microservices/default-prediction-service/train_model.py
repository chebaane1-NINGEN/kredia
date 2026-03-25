"""
Script d'entraînement du modèle de prédiction de défaut de paiement.
Génère des données synthétiques basées sur les features du Credit KREDIA.
Exécuter une seule fois : python train_model.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
import joblib
import os

np.random.seed(42)
N = 5000

# --- Chargement dataset (réel ou synthétique) ---
DATASET_PATH = "dataset_example.csv"

if os.path.exists(DATASET_PATH):
    print(f"Dataset trouvé: {DATASET_PATH} — entraînement sur données réelles")
    df = pd.read_csv(DATASET_PATH)
    # Encoder repayment_type
    repayment_map = {"AMORTISSEMENT_CONSTANT": 0, "MENSUALITE_CONSTANTE": 1, "IN_FINE": 2}
    df["repayment_type"] = df["repayment_type"].map(repayment_map)
    df["debt_ratio"] = (df["amount"] / (df["income"] * df["term_months"])).clip(0, 5)
else:
    print("Aucun dataset trouvé — génération de données synthétiques")
    # --- Génération des données synthétiques ---
    amount       = np.random.uniform(5000, 200000, N)
    income       = np.random.uniform(1500, 20000, N)
    dependents   = np.random.randint(0, 7, N)
    interest_rate = np.random.uniform(3.0, 18.0, N)
    term_months  = np.random.choice([12, 24, 36, 48, 60, 84, 120], N)
    repayment_type = np.random.choice([0, 1, 2], N)
    overdue_ratio = np.random.uniform(0, 1, N)
    partial_ratio = np.random.uniform(0, 1 - overdue_ratio, N)
    debt_ratio = (amount / (income * term_months)).clip(0, 5)
    default_score = (
        0.30 * (debt_ratio / 5)
        + 0.35 * overdue_ratio
        + 0.15 * partial_ratio
        + 0.10 * (dependents / 6)
        + 0.10 * ((interest_rate - 3) / 15)
    )
    noise = np.random.normal(0, 0.05, N)
    default_prob = (default_score + noise).clip(0, 1)
    df = pd.DataFrame({
        "amount": amount, "income": income, "dependents": dependents,
        "interest_rate": interest_rate, "term_months": term_months,
        "repayment_type": repayment_type, "overdue_ratio": overdue_ratio,
        "partial_ratio": partial_ratio, "debt_ratio": debt_ratio,
        "default": (default_prob > 0.45).astype(int)
    })

# --- Entraînement ---
FEATURES = ["amount", "income", "dependents", "interest_rate",
            "term_months", "repayment_type", "overdue_ratio", "partial_ratio", "debt_ratio"]

X = df[FEATURES]
y = df["default"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    class_weight="balanced",
    random_state=42
)
model.fit(X_train, y_train)

print("=== Rapport de classification ===")
print(classification_report(y_test, model.predict(X_test)))

# --- Sauvegarde ---
os.makedirs("model", exist_ok=True)
joblib.dump(model, "model/default_model.pkl")
print("Modèle sauvegardé dans model/default_model.pkl")
