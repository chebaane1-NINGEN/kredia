package com.kredia.dto.reclamation;

import com.kredia.dto.ml.RiskFeaturesDto;
import com.kredia.enums.Priority;
import com.kredia.enums.ReclamationCategory;
import com.kredia.enums.ReclamationRiskLevel;
import com.kredia.enums.ReclamationStatus;

import java.time.LocalDateTime;

public record ReclamationResponse(
        Long reclamationId,
        Long userId,
        Long assignedTo,
        String subject,
        String description,
        ReclamationStatus status,
        Priority priority,
        ReclamationCategory category,
        int duplicateCount,
        Double riskScore,
        ReclamationRiskLevel riskLevel,
        LocalDateTime createdAt,
        LocalDateTime lastActivityAt,
        LocalDateTime firstResponseAt,
        LocalDateTime firstResponseDueAt,
        LocalDateTime resolutionDueAt,
        LocalDateTime resolvedAt,
        Integer customerSatisfactionScore,
        String customerFeedback,
        boolean slaBreached,
        RiskFeaturesDto modelInput
) {}
