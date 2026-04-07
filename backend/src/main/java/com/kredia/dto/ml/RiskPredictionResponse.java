package com.kredia.dto.ml;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RiskPredictionResponse(
        @JsonAlias({"risk_score", "riskScore"}) double riskScore,
        @JsonAlias({"risk_level", "riskLevel"}) String riskLevel,
        @JsonAlias("probability") Double probability
) {}
