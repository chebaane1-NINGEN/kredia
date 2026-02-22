package com.kredia.dto.kyc;

import com.kredia.enums.DocumentTypeLoan;
import com.kredia.enums.KycStatus;

import java.time.LocalDateTime;

public record KycLoanResponse(
        Long kycLoanId,
        Long creditId,
        Long userId,
        DocumentTypeLoan documentType,
        String documentPath,
        LocalDateTime submittedAt,
        KycStatus verifiedStatus,
        String verificationMessage
) {}
