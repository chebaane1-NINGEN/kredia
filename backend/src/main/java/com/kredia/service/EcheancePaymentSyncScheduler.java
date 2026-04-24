package com.kredia.service;

import com.kredia.entity.credit.Echeance;
import com.kredia.repository.EcheanceRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EcheancePaymentSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(EcheancePaymentSyncScheduler.class);

    private final EcheanceRepository echeanceRepository;
    private final EcheanceService echeanceService;

    @Scheduled(fixedDelay = 20000) // every 20 seconds
    public void syncEcheancesWithTransactions() {
        List<Echeance> pendingEcheances = echeanceRepository.findPendingEcheancesWithTransaction();
        
        if (!pendingEcheances.isEmpty()) {
            log.info("Found {} echeances with transactions to sync.", pendingEcheances.size());
            for (Echeance echeance : pendingEcheances) {
                echeanceService.checkAndUpdateStatus(echeance);
            }
        }
    }
}
