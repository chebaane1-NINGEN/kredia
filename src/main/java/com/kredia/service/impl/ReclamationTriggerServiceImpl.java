package com.kredia.service.impl;

import com.kredia.entity.support.Notification;
import com.kredia.entity.support.Reclamation;
import com.kredia.enums.NotificationType;
import com.kredia.enums.ReclamationStatus;
import com.kredia.repository.NotificationRepository;
import com.kredia.service.ReclamationTriggerService;
import com.kredia.util.NotificationFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReclamationTriggerServiceImpl implements ReclamationTriggerService {

    private final NotificationRepository notificationRepository;

    private static final Long SUPERVISOR_ID = 999L;

    @Override
    public void onCreated(Reclamation r) {
        Notification n = NotificationFactory.forUser(
                r.getId(),
                r.getId(),
                NotificationType.PUSH,
                "Complaint received",
                "Your complaint #" + r.getId() + " has been received."
        );
        notificationRepository.save(n);
    }

    @Override
    public void onStatusChanged(Reclamation r, ReclamationStatus oldStatus, ReclamationStatus newStatus, String note, Long actorUserId) {
        Notification userNotif = NotificationFactory.forUser(
                r.getId(),
                r.getId(),
                NotificationType.PUSH,
                "Complaint status updated",
                "Your complaint #" + r.getId() + " changed to " + newStatus
        );
        notificationRepository.save(userNotif);

        if (r.getAssignedTo() != null) {
            Notification agentNotif = NotificationFactory.forUser(
                    r.getAssignedTo(),
                    r.getId(),
                    NotificationType.PUSH,
                    "Assigned complaint update",
                    "Complaint #" + r.getId() + " is now " + newStatus
            );
            notificationRepository.save(agentNotif);
        }
    }

    @Override
    public void onEscalated(Reclamation r, double riskScore, String reason) {
        Notification supervisorNotif = NotificationFactory.forUser(
                SUPERVISOR_ID,
                r.getId(),
                NotificationType.PUSH,
                "Escalation alert",
                "Complaint #" + r.getId() + " escalated. RiskScore=" + (int) riskScore
        );
        notificationRepository.save(supervisorNotif);
    }
}
