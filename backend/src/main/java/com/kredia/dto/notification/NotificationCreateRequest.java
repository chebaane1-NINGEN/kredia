package com.kredia.dto.notification;

import com.kredia.enums.NotificationType;
import jakarta.validation.constraints.*;

public record NotificationCreateRequest(
        @NotNull(message = "userId is required")
        Long userId,

        Long reclamationId,

        @NotNull(message = "type is required")
        NotificationType type,

        @NotBlank(message = "title is required")
        @Size(max = 150)
        String title,

        @NotBlank(message = "message is required")
        @Size(min = 3, max = 5000)
        String message
) {}
