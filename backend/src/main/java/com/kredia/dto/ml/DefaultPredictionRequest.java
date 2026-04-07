package com.kredia.dto.ml;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DefaultPredictionRequest(
        float amount,
        float income,
        int dependents,
        @JsonProperty("interest_rate") float interestRate,
        @JsonProperty("term_months") int termMonths,
        @JsonProperty("repayment_type") String repaymentType,
        @JsonProperty("overdue_ratio") double overdueRatio,
        @JsonProperty("partial_ratio") double partialRatio
) {}
