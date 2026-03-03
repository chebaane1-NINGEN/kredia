package com.kredia.dto.reclamation;

public record RiskScoreResponse(
        Long id,
        double riskScore,
        RiskFeatures features
) {}
