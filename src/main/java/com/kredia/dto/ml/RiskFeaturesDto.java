package com.kredia.dto.ml;

public record RiskFeaturesDto(
        String subject,
        String description,
        String status,
        String priority,
        int duplicate_count,
        int past_reclamations,
        double transaction_amount,
        int late_credit
) {}
