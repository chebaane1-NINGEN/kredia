package com.kredia.dto.reclamation;

import com.kredia.enums.Priority;
import jakarta.validation.constraints.*;

public record ReclamationUpdateRequest(
        @NotBlank(message = "subject is required")
        @Size(max = 150, message = "subject must be <= 150 chars")
        String subject,

        @NotBlank(message = "description is required")
        @Size(min = 10, max = 5000, message = "description must be 10..5000 chars")
        String description,

        @NotNull(message = "priority is required")
        Priority priority
) {}

