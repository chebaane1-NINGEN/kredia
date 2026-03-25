package com.kredia.dto.ml;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DefaultPredictionRequest(
        float amount,
        float income,
        int dependents,
        @JsonProperty("interest_rate") float interestRate,
        @JsonProperty("term_months") int termMonths,
        @JsonProperty("repayment_type") String repaymentType,
        @JsonProperty("overdue_ratio") double overdueRatio,   // % échéances OVERDUE (0.0 à 1.0)
        @JsonProperty("partial_ratio") double partialRatio    // % échéances PARTIALLY_PAID (0.0 à 1.0)
) {}
