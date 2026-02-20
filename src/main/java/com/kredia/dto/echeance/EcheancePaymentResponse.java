package com.kredia.dto.echeance;

import com.kredia.entity.credit.Echeance;

import java.math.BigDecimal;

public record EcheancePaymentResponse(
        Echeance echeance,
        boolean isPartialPayment,
        String message,
        BigDecimal amountPaid,
        BigDecimal remainingAmount
) {}

