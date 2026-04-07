package com.kredia.service;

import com.kredia.entity.support.Reclamation;
import com.kredia.enums.ReclamationStatus;

public interface ReclamationTriggerService {

    void onCreated(Reclamation r);

    void onStatusChanged(Reclamation r, ReclamationStatus oldStatus, ReclamationStatus newStatus, String note, Long actorUserId);

    void onEscalated(Reclamation r, double riskScore, String reason);

    void onMessageAdded(Reclamation r, Long authorUserId, boolean internalNote);

    void onFeedbackSubmitted(Reclamation r);
}
