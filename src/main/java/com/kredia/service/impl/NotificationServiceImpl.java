package com.kredia.service.impl;

import com.kredia.dto.notification.*;
import com.kredia.entity.support.Notification;
import com.kredia.exception.NotFoundException;
import com.kredia.repository.NotificationRepository;
import com.kredia.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public NotificationResponse create(NotificationCreateRequest request) {
        Notification n = Notification.builder()
                .userId(request.userId())
                .reclamationId(request.reclamationId())
                .type(request.type())
                .title(request.title())
                .message(request.message())
                .isRead(false)
                .build();

        return toResponse(notificationRepository.save(n));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getByUser(Long userId, Boolean isRead, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("sentAt").descending());

        if (isRead == null) {
            return notificationRepository.findByUserId(userId, pageable).map(this::toResponse);
        }
        return notificationRepository.findByUserIdAndIsRead(userId, isRead, pageable).map(this::toResponse);
    }

    @Override
    public NotificationResponse markAsRead(Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Notification not found: " + notificationId));

        n.setRead(true);
        return toResponse(notificationRepository.save(n));
    }

    @Override
    public void delete(Long notificationId) {
        if (!notificationRepository.existsById(notificationId)) {
            throw new NotFoundException("Notification not found: " + notificationId);
        }
        notificationRepository.deleteById(notificationId);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getNotificationId(),
                n.getUserId(),
                n.getReclamationId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.isRead(),
                n.getSentAt()
        );
    }
}
