package com.kredia.dto.reclamation;

import com.kredia.dto.ml.RiskFeaturesDto;
import com.kredia.enums.Priority;
import com.kredia.enums.ReclamationRiskLevel;
import com.kredia.enums.ReclamationStatus;

import java.time.LocalDateTime;

public record ReclamationResponse(
        Long id,
        Long userId,
        String subject,
        String description,
        ReclamationStatus status,
        Priority priority,
        Double riskScore,
        ReclamationRiskLevel riskLevel,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt,
        RiskFeaturesDto modelInput
) {}
