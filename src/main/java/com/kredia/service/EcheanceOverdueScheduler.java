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
@RequiredArgsConstructor
public class EcheanceOverdueScheduler {

    private static final Logger log = LoggerFactory.getLogger(EcheanceOverdueScheduler.class);

    private final EcheanceRepository echeanceRepository;
    private final CreditRepository creditRepository;
    private final EmailService emailService;

    // Exécution toutes les 10 secondes pour tester l'envoi d'email en temps réel
    @Scheduled(fixedDelay = 10000)
    @Transactional
    public void markOverdueEcheances() {
        LocalDate today = LocalDate.now();

        List<Echeance> late = echeanceRepository.findByStatusInAndDueDateBefore(
                List.of(EcheanceStatus.PENDING, EcheanceStatus.PARTIALLY_PAID),
                today
        );

        if (late.isEmpty()) return;

        // Taux de pénalité de 5%
        java.math.BigDecimal penaltyRate = new java.math.BigDecimal("0.05");

        late.forEach(e -> {
            e.setStatus(EcheanceStatus.OVERDUE);
            // Ajout de 5% de pénalité sur le montant dû
            java.math.BigDecimal penalty = e.getAmountDue().multiply(penaltyRate);
            e.setAmountDue(e.getAmountDue().add(penalty).setScale(2, java.math.RoundingMode.HALF_EVEN));
            
            // Envoi de l'email
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
        echeanceRepository.saveAll(late);
        log.info("{} échéance(s) passées en OVERDUE", late.size());
    }
}
