package com.kredia.dto.reclamation;

import com.kredia.enums.ReclamationMessageVisibility;

import java.time.LocalDateTime;

public record ReclamationMessageResponse(
        Long messageId,
        Long authorUserId,
        ReclamationMessageVisibility visibility,
        String message,
        LocalDateTime createdAt
) {}
