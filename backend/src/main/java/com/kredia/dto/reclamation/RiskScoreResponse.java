package com.kredia.dto.reclamation;

public record RiskScoreResponse(
        Long reclamationId,
        double riskScore,
        RiskFeatures features
) {}
