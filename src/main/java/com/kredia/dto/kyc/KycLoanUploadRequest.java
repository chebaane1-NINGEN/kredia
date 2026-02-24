package com.kredia.dto.kyc;

import com.kredia.enums.DocumentTypeLoan;
import jakarta.validation.constraints.NotNull;

public record KycLoanUploadRequest(
        @NotNull(message = "Credit ID est obligatoire")
        Long creditId,
        
        @NotNull(message = "User ID est obligatoire")
        Long userId,
        
        @NotNull(message = "Type de document est obligatoire")
        DocumentTypeLoan documentType
) {}
