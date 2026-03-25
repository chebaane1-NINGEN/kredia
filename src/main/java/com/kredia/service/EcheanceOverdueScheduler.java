package com.kredia.service;

import com.kredia.entity.credit.Echeance;
import com.kredia.enums.EcheanceStatus;
import com.kredia.repository.EcheanceRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class EcheanceOverdueScheduler {

    private static final Logger log = LoggerFactory.getLogger(EcheanceOverdueScheduler.class);

    private final EcheanceRepository echeanceRepository;

    // Au démarrage puis toutes les heures
    @Scheduled(fixedRate = 3600000, initialDelay = 0)
    @Transactional
    public void markOverdueEcheances() {
        LocalDate today = LocalDate.now();

        List<Echeance> late = echeanceRepository.findByStatusInAndDueDateBefore(
                List.of(EcheanceStatus.PENDING, EcheanceStatus.PARTIALLY_PAID),
                today
        );

        if (late.isEmpty()) return;

        late.forEach(e -> e.setStatus(EcheanceStatus.OVERDUE));
        echeanceRepository.saveAll(late);
        log.info("{} échéance(s) passées en OVERDUE", late.size());
    }
}
