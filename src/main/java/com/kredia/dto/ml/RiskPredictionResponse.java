package com.kredia.dto.ml;

public record RiskPredictionResponse(
        double riskScore,
        double probability
) {}
