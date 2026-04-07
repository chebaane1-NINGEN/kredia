package com.kredia.dto.reclamation;

import com.kredia.enums.ReclamationStatus;

import java.time.LocalDateTime;

public record ReclamationHistoryResponse(
        Long historyId,
        Long actorUserId,
        ReclamationStatus oldStatus,
        ReclamationStatus newStatus,
        LocalDateTime changedAt,
        String note
) {}
