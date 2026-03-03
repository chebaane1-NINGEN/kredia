package com.kredia.dto.notification;

import com.kredia.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        Long userId,
        Long id,
        NotificationType type,
        String title,
        String message,
        boolean isRead,
        LocalDateTime sentAt) {
}
