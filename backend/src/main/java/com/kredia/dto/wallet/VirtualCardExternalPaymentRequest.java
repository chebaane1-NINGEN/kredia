package com.kredia.dto.wallet;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record VirtualCardExternalPaymentRequest(

        @NotBlank(message = "Card number is required")
        String cardNumber,

        @NotBlank(message = "CVV is required")
        String cvv,

        @NotBlank(message = "Expiry date is required")
        String expiryDate,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
        BigDecimal amount,

        String merchant
) {
}

