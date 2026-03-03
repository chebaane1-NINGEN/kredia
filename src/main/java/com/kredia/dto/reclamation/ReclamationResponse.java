package com.kredia.dto.reclamation;

import com.kredia.enums.Priority;
import com.kredia.enums.ReclamationStatus;

import java.time.LocalDateTime;

public record ReclamationResponse(
        Long reclamationId,
        Long userId,
        String subject,
        String description,
        ReclamationStatus status,
        Priority priority,
        Double riskScore,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt
) {}
