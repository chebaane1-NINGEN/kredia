package com.kredia.dto.reclamation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReclamationFeedbackRequest(
        @NotNull(message = "actorUserId is required")
        Long actorUserId,

        @NotNull(message = "customerSatisfactionScore is required")
        @Min(value = 1, message = "customerSatisfactionScore must be >= 1")
        @Max(value = 5, message = "customerSatisfactionScore must be <= 5")
        Integer customerSatisfactionScore,

        @Size(max = 500, message = "customerFeedback must be <= 500 chars")
        String customerFeedback
) {}
