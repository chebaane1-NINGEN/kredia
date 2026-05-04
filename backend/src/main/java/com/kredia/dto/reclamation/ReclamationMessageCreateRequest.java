package com.kredia.dto.reclamation;

import com.kredia.enums.ReclamationMessageVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReclamationMessageCreateRequest(
        @NotNull(message = "authorUserId is required")
        Long authorUserId,

        @NotNull(message = "visibility is required")
        ReclamationMessageVisibility visibility,

        @NotBlank(message = "message is required")
        @Size(min = 2, max = 5000, message = "message must be 2..5000 chars")
        String message
) {}
