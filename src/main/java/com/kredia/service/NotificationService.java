package com.kredia.service;

import com.kredia.dto.notification.*;
import org.springframework.data.domain.Page;

public interface NotificationService {
    NotificationResponse create(NotificationCreateRequest request);

    Page<NotificationResponse> getByUser(Long userId, Boolean isRead, int page, int size);

    NotificationResponse markAsRead(Long id);

    void delete(Long id);
}
