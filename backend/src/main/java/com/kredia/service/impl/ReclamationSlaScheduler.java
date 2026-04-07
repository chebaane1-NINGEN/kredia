package com.kredia.service.impl;

import com.kredia.entity.support.Reclamation;
import com.kredia.entity.support.ReclamationHistory;
import com.kredia.enums.Priority;
import com.kredia.enums.ReclamationStatus;
import com.kredia.repository.ReclamationHistoryRepository;
import com.kredia.repository.ReclamationRepository;
import com.kredia.service.ReclamationTriggerService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class ReclamationSlaScheduler {

    private static final List<ReclamationStatus> SLA_TRACKED_STATUSES = List.of(
            ReclamationStatus.OPEN,
            ReclamationStatus.IN_PROGRESS,
            ReclamationStatus.WAITING_CUSTOMER,
            ReclamationStatus.REOPENED
    );

    private final ReclamationRepository reclamationRepository;
    private final ReclamationHistoryRepository historyRepository;
    private final ReclamationTriggerService triggerService;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoEscalateSlaBreaches() {
        LocalDateTime now = LocalDateTime.now();
        Set<Long> processed = new HashSet<>();

        List<Reclamation> firstResponseOverdue = reclamationRepository
                .findByFirstResponseDueAtBeforeAndFirstResponseAtIsNullAndStatusIn(now, SLA_TRACKED_STATUSES);
        for (Reclamation reclamation : firstResponseOverdue) {
            if (processed.add(reclamation.getReclamationId())) {
                escalate(reclamation, "First response SLA exceeded");
            }
        }

        List<Reclamation> resolutionOverdue = reclamationRepository
                .findByResolutionDueAtBeforeAndStatusIn(now, SLA_TRACKED_STATUSES);
        for (Reclamation reclamation : resolutionOverdue) {
            if (processed.add(reclamation.getReclamationId())) {
                escalate(reclamation, "Resolution SLA exceeded");
            }
        }
    }

    private void escalate(Reclamation reclamation, String reason) {
        ReclamationStatus oldStatus = reclamation.getStatus();
        reclamation.setPriority(Priority.HIGH);
        reclamation.setStatus(ReclamationStatus.ESCALATED);
        if (reclamation.getRiskScore() == null) {
            reclamation.setRiskScore(75.0);
        }

        Reclamation saved = reclamationRepository.save(reclamation);
        historyRepository.save(ReclamationHistory.builder()
                .reclamation(saved)
                .userId(null)
                .oldStatus(oldStatus)
                .newStatus(ReclamationStatus.ESCALATED)
                .note("AUTO_ESCALATED due to SLA: " + reason)
                .build());
        triggerService.onEscalated(saved, saved.getRiskScore(), reason);
    }
}
