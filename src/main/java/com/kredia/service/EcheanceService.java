package com.kredia.service;

import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.Echeance;
import com.kredia.enums.CreditStatus;
import com.kredia.enums.EcheanceStatus;
import com.kredia.repository.CreditRepository;
import com.kredia.repository.EcheanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class EcheanceService {

    private static final Logger log = LoggerFactory.getLogger(EcheanceService.class);

    private final EcheanceRepository echeanceRepository;
    private final CreditRepository creditRepository;

    @Autowired
    public EcheanceService(EcheanceRepository echeanceRepository, CreditRepository creditRepository) {
        this.echeanceRepository = echeanceRepository;
        this.creditRepository = creditRepository;
    }

    /**
     * Verifie si l'echeance a une transaction liee, et si oui met a jour le statut.
     */
    @Transactional
    public void checkAndUpdateStatus(Echeance echeance) {
        if (echeance.getStatus() == EcheanceStatus.PENDING) {
            int count = echeanceRepository.countTransactionsByEcheanceId(echeance.getEcheanceId());
            log.info("Echeance {} has {} transactions linked", echeance.getEcheanceId(), count);
            if (count > 0) {
                markAsPaid(echeance);
            }
        }
    }

    /**
     * Tache planifiee: verifie toutes les 5 secondes
     */
    @Scheduled(fixedRate = 5000)
    @Transactional
    public void updateEcheanceStatusFromTransactions() {
        try {
            List<Echeance> pendingWithTransaction = echeanceRepository.findPendingEcheancesWithTransaction();
            log.info("Scheduled check: found {} pending echeances with transactions", pendingWithTransaction.size());
            for (Echeance echeance : pendingWithTransaction) {
                markAsPaid(echeance);
            }
        } catch (Exception e) {
            log.error("Error during scheduled echeance status update: {}", e.getMessage(), e);
        }
    }

    private void markAsPaid(Echeance echeance) {
        echeance.setStatus(EcheanceStatus.PAID);
        echeance.setAmountPaid(echeance.getAmountDue());
        echeance.setPaidAt(LocalDateTime.now());
        echeanceRepository.save(echeance);
        log.info("Echeance {} marked as PAID", echeance.getEcheanceId());

        // Check if all echeances for this credit are paid
        if (echeance.getCredit() != null) {
            Long creditId = echeance.getCredit().getCreditId();
            long pendingCount = echeanceRepository.countPendingEcheancesByCreditId(creditId);
            if (pendingCount == 0) {
                Credit credit = creditRepository.findById(creditId)
                        .orElseThrow(() -> new RuntimeException("Credit not found"));
                credit.setStatus(CreditStatus.COMPLETED);
                creditRepository.save(credit);
                log.info("Credit {} marked as COMPLETED", creditId);
            }
        }
    }

    @Transactional
    public Optional<Echeance> getEcheanceById(Long id) {
        Optional<Echeance> opt = echeanceRepository.findById(id);
        opt.ifPresent(this::checkAndUpdateStatus);
        return echeanceRepository.findById(id);
    }

    @Transactional
    public List<Echeance> getAllEcheances() {
        List<Echeance> echeances = echeanceRepository.findAll();
        echeances.forEach(this::checkAndUpdateStatus);
        return echeanceRepository.findAll();
    }

    @Transactional
    public Echeance payEcheance(Long echeanceId) {
        Echeance echeance = echeanceRepository.findById(echeanceId)
                .orElseThrow(() -> new RuntimeException("Echeance not found with id " + echeanceId));

        if (echeance.getStatus() == EcheanceStatus.PAID) {
            throw new RuntimeException("Cette echeance est deja payee");
        }

        markAsPaid(echeance);

        return echeance;
    }
}
