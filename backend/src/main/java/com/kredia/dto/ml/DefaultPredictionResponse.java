package com.kredia.dto.ml;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DefaultPredictionResponse(
        @JsonProperty("credit_id") Long creditId,
        @JsonProperty("default_probability") double defaultProbability,
        @JsonProperty("risk_label") String riskLabel,
        @JsonProperty("risk_level") String riskLevel,
        String recommendation
) {}
