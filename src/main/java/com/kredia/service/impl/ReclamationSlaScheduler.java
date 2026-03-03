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
import java.util.List;

@Component
@RequiredArgsConstructor
public class ReclamationSlaScheduler {

    private final ReclamationRepository reclamationRepository;
    private final ReclamationHistoryRepository historyRepository;
    private final ReclamationTriggerService triggerService;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void autoEscalateOldOpenTickets() {

        LocalDateTime limit = LocalDateTime.now().minusHours(6);

        List<Reclamation> oldOpen = reclamationRepository
                .findByStatusAndLastActivityAtBefore(ReclamationStatus.OPEN, limit);

        for (Reclamation r : oldOpen) {

            r.setPriority(Priority.HIGH);
            r.setStatus(ReclamationStatus.IN_PROGRESS);

            if (r.getRiskScore() == null) r.setRiskScore(75.0);

            Reclamation saved = reclamationRepository.save(r);

            triggerService.onEscalated(saved, saved.getRiskScore(), "SLA exceeded");

            ReclamationHistory history = new ReclamationHistory();
            history.setReclamation(saved);
            history.setUserId(0L);
            history.setOldStatus(ReclamationStatus.OPEN);
            history.setNewStatus(ReclamationStatus.IN_PROGRESS);
            history.setNote("AUTO_ESCALATED due to SLA");
            historyRepository.save(history);
        }
    }
}
