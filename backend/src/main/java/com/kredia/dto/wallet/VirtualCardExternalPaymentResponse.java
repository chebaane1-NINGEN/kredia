package com.kredia.dto.wallet;

import java.math.BigDecimal;

public record VirtualCardExternalPaymentResponse(
        String approvalLink,
        BigDecimal amountPaid,
        BigDecimal oldBalance,
        BigDecimal newBalance
) {
}

