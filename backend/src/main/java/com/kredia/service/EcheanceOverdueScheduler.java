package com.kredia.service;

import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.Echeance;
import com.kredia.entity.user.User;
import com.kredia.enums.EcheanceStatus;
import com.kredia.repository.CreditRepository;
import com.kredia.repository.EcheanceRepository;
import com.kredia.service.IEmailService;
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
    private final IEmailService emailService;

    // Track echeances for which overdue email was already sent (in-memory, reset on restart)
    private final java.util.Set<Long> overdueEmailSent = java.util.Collections
            .newSetFromMap(new java.util.concurrent.ConcurrentHashMap<>());

    public EcheanceOverdueScheduler(EcheanceRepository echeanceRepository,
                                     CreditRepository creditRepository,
                                     IEmailService emailService) {
        this.echeanceRepository = echeanceRepository;
        this.creditRepository = creditRepository;
        this.emailService = emailService;
    }

    @Scheduled(initialDelay = 3600000, fixedDelay = 3600000) // first run after 1 hour
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

            // Send email only once per echeance, with delay to respect Mailtrap rate limit
            if (overdueEmailSent.add(e.getEcheanceId())) {
                try {
                    if (e.getCredit() != null && e.getCredit().getCreditId() != null) {
                        Credit credit = creditRepository.findById(e.getCredit().getCreditId()).orElse(null);
                        if (credit != null && credit.getUser() != null) {
                            User user = credit.getUser();
                            emailService.sendEcheanceOverdueEmail(user, e);
                            log.info("Overdue email sent for echeance {}", e.getEcheanceId());
                            // Respect Mailtrap free plan: 1 email/second
                            Thread.sleep(2000);
                        }
                    }
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                } catch (Exception ex) {
                    overdueEmailSent.remove(e.getEcheanceId()); // retry next time
                    log.error("Failed to send OVERDUE email for Echeance {}: {}", e.getEcheanceId(), ex.getMessage());
                }
            }
        });
        echeanceRepository.saveAll(echeancesToProcess);
        log.info("{} échéance(s) passées en OVERDUE", echeancesToProcess.size());
    }
}
