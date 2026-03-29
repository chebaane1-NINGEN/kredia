"""
KREDIA - Default Prediction Microservice
FastAPI + scikit-learn Random Forest
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os

app = FastAPI(title="KREDIA Default Prediction Service", version="1.0.0")

MODEL_PATH = "model/default_model.pkl"
model = None

@app.on_event("startup")
def load_model():
    global model
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(
            f"Modèle introuvable: {MODEL_PATH}. "
            "Exécutez d'abord: python train_model.py"
        )
    model = joblib.load(MODEL_PATH)
    print(f"Modèle chargé depuis {MODEL_PATH}")



class PredictionRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Montant du crédit")
    income: float = Field(..., gt=0, description="Revenu mensuel")
    dependents: int = Field(..., ge=0, description="Nombre de personnes à charge")
    interest_rate: float = Field(..., gt=0, description="Taux d'intérêt annuel (%)")
    term_months: int = Field(..., gt=0, description="Durée en mois")
    repayment_type: str = Field(..., description="AMORTISSEMENT_CONSTANT | MENSUALITE_CONSTANTE | IN_FINE")
    overdue_ratio: float = Field(0.0, ge=0.0, le=1.0, description="% échéances OVERDUE (0.0 à 1.0)")
    partial_ratio: float = Field(0.0, ge=0.0, le=1.0, description="% échéances PARTIALLY_PAID (0.0 à 1.0)")


class PredictionResponse(BaseModel):
    credit_id: int | None = None
    default_probability: float
    risk_label: str
    risk_level: str
    recommendation: str



REPAYMENT_MAP = {
    "AMORTISSEMENT_CONSTANT": 0,
    "MENSUALITE_CONSTANTE": 1,
    "IN_FINE": 2,
}

def encode_repayment(repayment_type: str) -> int:
    val = REPAYMENT_MAP.get(repayment_type.upper())
    if val is None:
        raise HTTPException(
            status_code=400,
            detail=f"repayment_type invalide: {repayment_type}. "
                   f"Valeurs acceptées: {list(REPAYMENT_MAP.keys())}"
        )
    return val

import pandas as pd

def build_features(req: PredictionRequest) -> pd.DataFrame:
    debt_ratio = min(req.amount / (req.income * req.term_months), 5.0)
    repayment_encoded = encode_repayment(req.repayment_type)
    return pd.DataFrame([{
        "amount": req.amount,
        "income": req.income,
        "dependents": req.dependents,
        "interest_rate": req.interest_rate,
        "term_months": req.term_months,
        "repayment_type": repayment_encoded,
        "overdue_ratio": req.overdue_ratio,
        "partial_ratio": req.partial_ratio,
        "debt_ratio": debt_ratio,
    }])

def classify(prob: float, overdue_ratio: float, partial_ratio: float, debt_ratio: float) -> tuple[str, str, str]:
    if overdue_ratio >= 1.0:
        return "RISQUE_ÉLEVÉ", "HIGH", "Risque élevé de défaut. Toutes les échéances sont en retard."
    if prob < 0.35:
        return "RISQUE_FAIBLE", "LOW", "Crédit approuvable. Profil financier sain."
    elif prob < 0.55:
        return "RISQUE_MOYEN", "MEDIUM", "Surveillance recommandée. Vérifier les revenus et charges."
    else:
        return "RISQUE_ÉLEVÉ", "HIGH", "Risque élevé de défaut. Analyse approfondie requise avant approbation."



@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Modèle non chargé")

    features = build_features(req)
    prob = float(model.predict_proba(features)[0][1])
    debt_ratio = min(req.amount / (req.income * req.term_months), 5.0)
    risk_label, risk_level, recommendation = classify(prob, req.overdue_ratio, req.partial_ratio, debt_ratio)

    return PredictionResponse(
        default_probability=round(prob, 4),
        risk_label=risk_label,
        risk_level=risk_level,
        recommendation=recommendation,
    )


@app.post("/predict/{credit_id}", response_model=PredictionResponse)
def predict_with_id(credit_id: int, req: PredictionRequest):
    response = predict(req)
    response.credit_id = credit_id
    return response
