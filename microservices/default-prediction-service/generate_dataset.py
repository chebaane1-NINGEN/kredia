"""
Génère un dataset réaliste de 1000 crédits pour l'entraînement du modèle.
Exécuter: python generate_dataset.py
"""
import numpy as np
import pandas as pd

np.random.seed(42)
N = 1000

repayment_types = ["MENSUALITE_CONSTANTE", "AMORTISSEMENT_CONSTANT", "IN_FINE"]
rows = []

for _ in range(N):
    repayment = np.random.choice(repayment_types, p=[0.60, 0.25, 0.15])
    income = np.random.uniform(1500, 15000)
    dependents = np.random.randint(0, 7)
    term_months = np.random.choice([12, 24, 36, 48, 60, 84, 120])

    # Montant corrélé au revenu
    max_amount = income * term_months * 0.4
    amount = np.random.uniform(3000, max(3001, max_amount))

    # Taux corrélé au risque du profil
    base_rate = 4.0 + (dependents * 0.5) + (1 if repayment == "IN_FINE" else 0)
    interest_rate = np.clip(np.random.normal(base_rate, 2.0), 3.0, 18.0)

    debt_ratio = amount / (income * term_months)

    # Ratio overdue basé sur le profil de risque
    risk_score = (
        0.30 * min(debt_ratio / 0.5, 1.0)
        + 0.20 * (dependents / 6)
        + 0.20 * ((interest_rate - 3) / 15)
        + 0.15 * (1 if repayment == "IN_FINE" else 0)
        + 0.15 * (1 if income < 2500 else 0)
    )

    # overdue_ratio discret basé sur nombre d'échéances réelles (1/12, 2/12, etc.)
    possible_ratios = [0.0, 0.083, 0.167, 0.25, 0.333, 0.5, 0.667, 0.833, 1.0]
    if risk_score > 0.65:
        weights = [0.05, 0.05, 0.10, 0.15, 0.15, 0.20, 0.15, 0.10, 0.05]
    elif risk_score > 0.35:
        weights = [0.30, 0.20, 0.20, 0.15, 0.08, 0.04, 0.02, 0.01, 0.0]
    else:
        weights = [0.75, 0.15, 0.07, 0.02, 0.01, 0.0, 0.0, 0.0, 0.0]
    overdue_ratio = np.random.choice(possible_ratios, p=weights)

    partial_ratio = np.random.choice(
        [0.0, 0.08, 0.17],
        p=[0.75, 0.15, 0.10]
    ) if overdue_ratio < 0.5 else 0.0

    # Label default: logique claire et cohérente
    # 0 overdue + profil correct = sain
    # overdue élevé = défaut quasi certain
    default_prob = (
        0.65 * overdue_ratio
        + 0.15 * min(debt_ratio / 0.5, 1.0)
        + 0.10 * (dependents / 6)
        + 0.05 * ((interest_rate - 3) / 15)
        + 0.05 * (1 if repayment == "IN_FINE" else 0)
    )
    default = 1 if (default_prob + np.random.normal(0, 0.05)) > 0.20 else 0

    rows.append({
        "amount": round(amount, 2),
        "income": round(income, 2),
        "dependents": dependents,
        "interest_rate": round(interest_rate, 2),
        "term_months": term_months,
        "repayment_type": repayment,
        "overdue_ratio": round(overdue_ratio, 4),
        "partial_ratio": round(partial_ratio, 4),
        "default": default
    })

df = pd.DataFrame(rows)

# Stats
print(f"Total: {len(df)} lignes")
print(f"Default=0 (sain):  {(df['default']==0).sum()} ({(df['default']==0).mean()*100:.1f}%)")
print(f"Default=1 (défaut): {(df['default']==1).sum()} ({(df['default']==1).mean()*100:.1f}%)")
print(f"\nDistribution overdue_ratio:")
print(df['overdue_ratio'].value_counts().sort_index())

df.to_csv("dataset_example.csv", index=False)
print("\nDataset sauvegardé: dataset_example.csv")
