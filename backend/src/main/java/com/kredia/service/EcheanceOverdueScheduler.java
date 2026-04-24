package com.kredia.service;

import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.Echeance;
import com.kredia.entity.user.User;
import com.kredia.enums.EcheanceStatus;
import com.kredia.repository.CreditRepository;
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
public class EcheanceOverdueScheduler {

    private static final Logger log = LoggerFactory.getLogger(EcheanceOverdueScheduler.class);

    private final EcheanceRepository echeanceRepository;
    private final CreditRepository creditRepository;
    private final EmailService emailService;

    public EcheanceOverdueScheduler(EcheanceRepository echeanceRepository, CreditRepository creditRepository, EmailService emailService) {
        this.echeanceRepository = echeanceRepository;
        this.creditRepository = creditRepository;
        this.emailService = emailService;
    }

    @Scheduled(fixedDelay = 10000)
    @Transactional
    public void markOverdueEcheances() {
        LocalDate today = LocalDate.now();

        List<Echeance> late = echeanceRepository.findByStatusInAndDueDateBefore(
                List.of(EcheanceStatus.PENDING, EcheanceStatus.PARTIALLY_PAID),
                today
        );

        List<Echeance> echeancesToProcess = late.stream()
                .filter(e -> {
                    java.math.BigDecimal baseAmount = e.getPrincipalDue().add(e.getInterestDue());
                    java.math.BigDecimal penaltyThreshold = baseAmount.multiply(new java.math.BigDecimal("1.01"));
                    return e.getAmountDue().compareTo(penaltyThreshold) < 0;
                })
                .collect(java.util.stream.Collectors.toList());

        if (echeancesToProcess.isEmpty()) return;

        java.math.BigDecimal penaltyRate = new java.math.BigDecimal("0.05");

        echeancesToProcess.forEach(e -> {
            e.setStatus(EcheanceStatus.OVERDUE);
            java.math.BigDecimal penalty = e.getAmountDue().multiply(penaltyRate);
            e.setAmountDue(e.getAmountDue().add(penalty).setScale(2, java.math.RoundingMode.HALF_EVEN));
            
            try {
                if (e.getCredit() != null && e.getCredit().getCreditId() != null) {
                    Credit credit = creditRepository.findById(e.getCredit().getCreditId()).orElse(null);
                    if (credit != null && credit.getUser() != null) {
                        User user = credit.getUser();
                        user.getEmail();
                        user.getFirstName();
                        user.getLastName();
                        emailService.sendEcheanceOverdueEmail(user, e);
                    }
                }
            } catch (Exception ex) {
                log.error("Failed to prepare and send OVERDUE email for Echeance {}: {}", e.getEcheanceId(), ex.getMessage());
            }
        });
        echeanceRepository.saveAll(echeancesToProcess);
        log.info("{} échéance(s) passées en OVERDUE", echeancesToProcess.size());
    }
}
