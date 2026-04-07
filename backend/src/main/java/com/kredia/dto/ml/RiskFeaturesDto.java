package com.kredia.dto.ml;

public record RiskFeaturesDto(
        int complaints_last_90d,
        int message_len,
        double wallet_balance,
        double wallet_frozen_balance,
        int credit_has_active,
        int credit_installments_missed,
        int credit_days_late
) {}
