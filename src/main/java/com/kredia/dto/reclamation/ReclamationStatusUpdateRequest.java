package com.kredia.dto.reclamation;

import com.kredia.enums.ReclamationStatus;
import jakarta.validation.constraints.NotNull;

public record ReclamationStatusUpdateRequest(
        @NotNull(message = "actorUserId is required")
        Long actorUserId,

        @NotNull(message = "newStatus is required")
        ReclamationStatus newStatus,

        String note
) {}
