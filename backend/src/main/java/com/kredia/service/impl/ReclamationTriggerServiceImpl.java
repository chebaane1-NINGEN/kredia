package com.kredia.service.impl;

import com.kredia.entity.support.Notification;
import com.kredia.entity.support.Reclamation;
import com.kredia.enums.NotificationType;
import com.kredia.enums.ReclamationStatus;
import com.kredia.repository.NotificationRepository;
import com.kredia.repository.user.UserRepository;
import com.kredia.service.ReclamationTriggerService;
import com.kredia.util.NotificationFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class ReclamationTriggerServiceImpl implements ReclamationTriggerService {

    private static final Logger log = LoggerFactory.getLogger(ReclamationTriggerServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public ReclamationTriggerServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    private static final Long SUPERVISOR_ID = 999L;

    @Override
    public void onCreated(Reclamation r) {
        saveNotificationIfUserExists(
                r.getUserId(),
                r.getReclamationId(),
                NotificationType.PUSH,
                "Complaint received",
                "Your complaint #" + r.getReclamationId() + " has been received."
        );
    }

    @Override
    public void onStatusChanged(Reclamation r, ReclamationStatus oldStatus, ReclamationStatus newStatus, String note, Long actorUserId) {
        String statusMessage = oldStatus == newStatus
                ? "Your complaint #" + r.getReclamationId() + " has a new update"
                : "Your complaint #" + r.getReclamationId() + " changed from " + oldStatus + " to " + newStatus;
        if (note != null && !note.isBlank()) {
            statusMessage += ". Note: " + note;
        }

        saveNotificationIfUserExists(
                r.getUserId(),
                r.getReclamationId(),
                NotificationType.PUSH,
                "Complaint status updated",
                statusMessage
        );

        if (r.getAssignedTo() != null) {
            saveNotificationIfUserExists(
                    r.getAssignedTo(),
                    r.getReclamationId(),
                    NotificationType.PUSH,
                    "Assigned complaint update",
                    "Complaint #" + r.getReclamationId() + " is now " + newStatus
            );
        }
    }

    @Override
    public void onEscalated(Reclamation r, double riskScore, String reason) {
        saveNotificationIfUserExists(
                SUPERVISOR_ID,
                r.getReclamationId(),
                NotificationType.PUSH,
                "Escalation alert",
                "Complaint #" + r.getReclamationId() + " escalated. Reason=" + reason + ", RiskScore=" + (int) riskScore
        );

        if (r.getAssignedTo() != null) {
            saveNotificationIfUserExists(
                    r.getAssignedTo(),
                    r.getReclamationId(),
                    NotificationType.PUSH,
                    "Complaint escalated",
                    "Complaint #" + r.getReclamationId() + " requires urgent attention. Reason: " + reason
            );
        }
    }

    @Override
    public void onMessageAdded(Reclamation r, Long authorUserId, boolean internalNote) {
        if (internalNote) {
            if (r.getAssignedTo() != null && !Objects.equals(r.getAssignedTo(), authorUserId)) {
                saveNotificationIfUserExists(
                        r.getAssignedTo(),
                        r.getReclamationId(),
                        NotificationType.PUSH,
                        "Internal note added",
                        "Complaint #" + r.getReclamationId() + " has a new internal note."
                );
            }
            return;
        }

        if (Objects.equals(authorUserId, r.getUserId())) {
            Long recipientId = r.getAssignedTo() != null ? r.getAssignedTo() : SUPERVISOR_ID;
            saveNotificationIfUserExists(
                    recipientId,
                    r.getReclamationId(),
                    NotificationType.PUSH,
                    "Customer replied",
                    "Customer replied on complaint #" + r.getReclamationId() + "."
            );
            return;
        }

        saveNotificationIfUserExists(
                r.getUserId(),
                r.getReclamationId(),
                NotificationType.PUSH,
                "New response on your complaint",
                "Complaint #" + r.getReclamationId() + " has a new response."
        );
    }

    @Override
    public void onFeedbackSubmitted(Reclamation r) {
        Long recipientId = r.getAssignedTo() != null ? r.getAssignedTo() : SUPERVISOR_ID;
        saveNotificationIfUserExists(
                recipientId,
                r.getReclamationId(),
                NotificationType.PUSH,
                "Customer feedback received",
                "Complaint #" + r.getReclamationId() + " received a satisfaction score of "
                        + r.getCustomerSatisfactionScore() + "/5."
        );
    }

    private void saveNotificationIfUserExists(Long userId, Long reclamationId, NotificationType type,
                                              String title, String message) {
        if (userId == null) {
            log.warn("Skipping notification '{}' for reclamationId={} because userId is null", title, reclamationId);
            return;
        }
        if (!userRepository.existsById(userId)) {
            log.warn("Skipping notification '{}' for reclamationId={} because userId={} does not exist",
                    title, reclamationId, userId);
            return;
        }

        Notification notification = NotificationFactory.forUser(userId, reclamationId, type, title, message);
        notificationRepository.save(notification);
    }
}
