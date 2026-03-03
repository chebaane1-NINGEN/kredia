package com.kredia.dto.kyc;

import com.kredia.enums.DocumentTypeLoan;
import com.kredia.enums.KycStatus;

import java.time.LocalDateTime;

public record KycLoanResponse(
        Long id,
        Long id,
        Long userId,
        DocumentTypeLoan documentType,
        String documentPath,
        LocalDateTime submittedAt,
        KycStatus verifiedStatus,
        String verificationMessage) {
}
