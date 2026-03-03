package com.kredia.util;

import com.kredia.entity.support.Notification;
import com.kredia.enums.NotificationType;

public class NotificationFactory {

    public static Notification forUser(Long userId, Long id, NotificationType type, String title, String message) {
        return Notification.builder()
                .userId(userId)
                .id(id)
                .type(type)
                .title(title)
                .message(message)
                .isRead(false)
                .build();
    }
}
