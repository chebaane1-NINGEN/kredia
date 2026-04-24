package com.kredia.service;

import com.kredia.dto.echeance.EcheancePaymentResponse;
import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.Echeance;
import com.kredia.enums.CreditStatus;
import com.kredia.enums.EcheanceStatus;
import com.kredia.repository.CreditRepository;
import com.kredia.repository.EcheanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EcheanceService {

    private static final Logger log = LoggerFactory.getLogger(EcheanceService.class);

    private final EcheanceRepository echeanceRepository;
    private final CreditRepository creditRepository;
    private final EmailService emailService;

    private final java.util.Set<Long> emailSyncRejectedSent = java.util.Collections
            .newSetFromMap(new java.util.concurrent.ConcurrentHashMap<>());

    @Autowired
    public EcheanceService(EcheanceRepository echeanceRepository, CreditRepository creditRepository,
            EmailService emailService) {
        this.echeanceRepository = echeanceRepository;
        this.creditRepository = creditRepository;
        this.emailService = emailService;
    }

    @Transactional
    public void checkAndUpdateStatus(Echeance echeance) {
        if (echeance.getStatus() == EcheanceStatus.PENDING || echeance.getStatus() == EcheanceStatus.PARTIALLY_PAID
                || echeance.getStatus() == EcheanceStatus.OVERDUE) {

            boolean hasUnpaidPrevious = echeanceRepository.existsByCreditCreditIdAndEcheanceNumberLessThanAndStatusNot(
                    echeance.getCredit().getCreditId(),
                    echeance.getEcheanceNumber(),
                    EcheanceStatus.PAID);

            if (hasUnpaidPrevious) {
                if (emailSyncRejectedSent.add(echeance.getEcheanceId())) {
                    dispatchRejectedChronologicalEmailSafe(echeance);
                }
                log.warn("Sync skipped for echeance {}: previous echeances are not completely paid.",
                        echeance.getEcheanceId());
                return;
            } else {
                emailSyncRejectedSent.remove(echeance.getEcheanceId());
            }

            java.math.BigDecimal pendingAmount = echeanceRepository
                    .sumPendingTransactionAmountsByEcheanceId(echeance.getEcheanceId());

            if (pendingAmount != null && pendingAmount.compareTo(java.math.BigDecimal.ZERO) > 0) {
                java.math.BigDecimal currentAmountPaid = echeance.getAmountPaid() != null ? echeance.getAmountPaid()
                        : java.math.BigDecimal.ZERO;

                java.math.BigDecimal totalPaid = currentAmountPaid.add(pendingAmount);

                log.info("Echeance {} has new pending transactions amount: {}. Total Paid becomes: {}",
                        echeance.getEcheanceId(), pendingAmount, totalPaid);

                if (totalPaid.compareTo(echeance.getAmountDue()) >= 0) {
                    java.math.BigDecimal surplus = totalPaid.subtract(echeance.getAmountDue());

                    echeance.setAmountPaid(echeance.getAmountDue());
                    markAsPaid(echeance);

                    if (surplus.compareTo(java.math.BigDecimal.ZERO) > 0) {
                        log.info("Surplus de {} détecté pour l'échéance {}", surplus, echeance.getEcheanceId());

                        Long creditId = echeance.getCredit().getCreditId();
                        List<Echeance> nextEcheances = echeanceRepository.findNextUnpaidEcheancesByCreditId(creditId);

                        List<Echeance> remainingEcheances = nextEcheances.stream()
                                .filter(e -> !e.getEcheanceId().equals(echeance.getEcheanceId()))
                                .collect(java.util.stream.Collectors.toList());

                        int index = 0;
                        while (surplus.compareTo(java.math.BigDecimal.ZERO) > 0 && index < remainingEcheances.size()) {
                            Echeance nextEcheance = remainingEcheances.get(index);

                            java.math.BigDecimal nextCurrentPaid = nextEcheance.getAmountPaid() != null
                                    ? nextEcheance.getAmountPaid()
                                    : java.math.BigDecimal.ZERO;
                            java.math.BigDecimal nextRemainingDue = nextEcheance.getAmountDue()
                                    .subtract(nextCurrentPaid);

                            java.math.BigDecimal discount = nextRemainingDue.multiply(new java.math.BigDecimal("0.05"));
                            java.math.BigDecimal discountedRemainingDue = nextRemainingDue.subtract(discount)
                                    .setScale(2, java.math.RoundingMode.HALF_EVEN);

                            if (surplus.compareTo(discountedRemainingDue) >= 0) {
                                nextEcheance.setAmountDue(nextEcheance.getAmountDue().subtract(discount).setScale(2,
                                        java.math.RoundingMode.HALF_EVEN));
                                nextEcheance.setAmountPaid(nextEcheance.getAmountDue());
                                markAsPaid(nextEcheance);

                                surplus = surplus.subtract(discountedRemainingDue);
                                log.info(
                                        "Surplus appliqué avec 5% de remise (-{}). Échéance {} payée complètement. Surplus restant: {}",
                                        discount, nextEcheance.getEcheanceId(), surplus);
                            } else {
                                nextEcheance.setAmountPaid(nextCurrentPaid.add(surplus));
                                nextEcheance.setStatus(EcheanceStatus.PARTIALLY_PAID);
                                nextEcheance.setPaidAt(LocalDateTime.now());
                                echeanceRepository.save(nextEcheance);
                                dispatchPartiallyPaidEmailSafe(nextEcheance);

                                log.info(
                                        "Surplus de {} appliqué à l'échéance {}. Paiement partiel. Aucune remise. Plus de surplus.",
                                        surplus, nextEcheance.getEcheanceId());
                                surplus = java.math.BigDecimal.ZERO;
                            }
                            index++;
                        }

                        if (surplus.compareTo(java.math.BigDecimal.ZERO) > 0) {
                            log.info(
                                    "Il reste un surplus global de {} mais aucune échéance suivante à payer pour le crédit {}",
                                    surplus, creditId);
                        }
                    }
                } else {
                    echeance.setAmountPaid(totalPaid);
                    echeance.setStatus(EcheanceStatus.PARTIALLY_PAID);
                    echeance.setPaidAt(LocalDateTime.now());
                    echeanceRepository.save(echeance);
                    dispatchPartiallyPaidEmailSafe(echeance);
                }

                echeanceRepository.markTransactionsAsCompletedByEcheanceId(echeance.getEcheanceId());
            }
        }
    }

    private void dispatchPartiallyPaidEmailSafe(Echeance echeance) {
        try {
            if (echeance.getCredit() != null && echeance.getCredit().getCreditId() != null) {
                Long creditId = echeance.getCredit().getCreditId();
                Credit credit = creditRepository.findById(creditId).orElse(null);
                if (credit != null && credit.getUser() != null) {
                    com.kredia.entity.user.User user = credit.getUser();
                    user.getEmail();
                    user.getFirstName();
                    user.getLastName();
                    emailService.sendEcheancePartiallyPaidEmail(user, echeance);
                }
            }
        } catch (Exception e) {
            log.error("Failed to prepare and send partially paid email for Echeance {}: {}", echeance.getEcheanceId(),
                    e.getMessage());
        }
    }

    private void dispatchRejectedChronologicalEmailSafe(Echeance echeance) {
        try {
            if (echeance.getCredit() != null && echeance.getCredit().getCreditId() != null) {
                Long creditId = echeance.getCredit().getCreditId();
                Credit credit = creditRepository.findById(creditId).orElse(null);
                if (credit != null && credit.getUser() != null) {
                    com.kredia.entity.user.User user = credit.getUser();
                    user.getEmail();
                    user.getFirstName();
                    user.getLastName();
                    emailService.sendPaymentRejectedChronologicalEmail(user, echeance);
                }
            }
        } catch (Exception e) {
            log.error("Failed to prepare and send rejected chronological email for Echeance {}: {}",
                    echeance.getEcheanceId(), e.getMessage());
        }
    }

    private void markAsPaid(Echeance echeance) {
        echeance.setStatus(EcheanceStatus.PAID);
        if (echeance.getAmountPaid() == null || echeance.getAmountPaid().compareTo(echeance.getAmountDue()) != 0) {
            echeance.setAmountPaid(echeance.getAmountDue());
        }
        echeance.setPaidAt(LocalDateTime.now());
        echeanceRepository.save(echeance);
        log.info("Echeance {} marked as PAID with amount_paid: {}", echeance.getEcheanceId(), echeance.getAmountPaid());

        try {
            if (echeance.getCredit() != null && echeance.getCredit().getCreditId() != null) {
                Long creditId = echeance.getCredit().getCreditId();
                Credit credit = creditRepository.findById(creditId).orElse(null);
                if (credit != null && credit.getUser() != null) {
                    com.kredia.entity.user.User user = credit.getUser();
                    user.getEmail();
                    user.getFirstName();
                    user.getLastName();
                    emailService.sendEcheancePaidEmail(user, echeance);
                }
            }
        } catch (Exception e) {
            log.error("Failed to prepare and send confirmation email for Echeance {}: {}", echeance.getEcheanceId(),
                    e.getMessage());
        }

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
    public EcheancePaymentResponse getEcheanceById(Long id) {
        Echeance echeance = echeanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Echeance not found with id " + id));

        checkAndUpdateStatus(echeance);

        // Recharger l'échéance après la mise à jour
        echeance = echeanceRepository.findById(id).orElseThrow();

        return buildPaymentResponse(echeance);
    }

    @Transactional
    public List<EcheancePaymentResponse> getAllEcheances() {
        List<Echeance> echeances = echeanceRepository.findAll();
        echeances.forEach(this::checkAndUpdateStatus);

        // Recharger toutes les échéances après mise à jour
        echeances = echeanceRepository.findAll();

        return echeances.stream()
                .map(this::buildPaymentResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public List<EcheancePaymentResponse> getEcheancesByUserId(Long userId) {
        List<Echeance> echeances = echeanceRepository.findByCredit_User_Id(userId);
        echeances.forEach(this::checkAndUpdateStatus);

        // Recharger après mise à jour
        echeances = echeanceRepository.findByCredit_User_Id(userId);

        return echeances.stream()
                .map(this::buildPaymentResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public List<EcheancePaymentResponse> getEcheancesByCreditId(Long creditId) {
        List<Echeance> echeances = echeanceRepository.findByCreditCreditId(creditId);
        echeances.forEach(this::checkAndUpdateStatus);

        // Recharger après mise à jour
        echeances = echeanceRepository.findByCreditCreditId(creditId);

        return echeances.stream()
                .sorted(java.util.Comparator.comparingInt(Echeance::getEcheanceNumber))
                .map(this::buildPaymentResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    private EcheancePaymentResponse buildPaymentResponse(Echeance echeance) {
        java.math.BigDecimal amountPaid = echeance.getAmountPaid() != null ? echeance.getAmountPaid()
                : java.math.BigDecimal.ZERO;
        java.math.BigDecimal amountDue = echeance.getAmountDue();

        java.math.BigDecimal remainingAmount = amountDue.subtract(amountPaid);

        boolean isPartialPayment = false;
        String message = "";

        if (echeance.getStatus() == EcheanceStatus.PAID) {
            java.math.BigDecimal totalTransactions = echeanceRepository
                    .sumTransactionAmountsByEcheanceId(echeance.getEcheanceId());

            if (totalTransactions != null && totalTransactions.compareTo(amountDue) > 0) {
                java.math.BigDecimal surplus = totalTransactions.subtract(amountDue);

                java.math.BigDecimal lastTransactionAmount = echeanceRepository
                        .getLastTransactionAmountByEcheanceId(echeance.getEcheanceId());

                if (lastTransactionAmount != null) {
                    java.math.BigDecimal amountCountedFromLast = lastTransactionAmount.subtract(surplus);

                    message = "Échéance payée complètement avec surplus. Dernier paiement: " + lastTransactionAmount +
                            ". Montant comptabilisé: " + amountCountedFromLast +
                            ". Total payé: " + amountPaid +
                            ". Surplus: " + surplus;
                } else {
                    message = "Échéance payée complètement avec surplus. Paiement total des transactions: "
                            + totalTransactions +
                            ". Montant comptabilisé: " + amountPaid +
                            ". Montant dû: " + amountDue +
                            ". Surplus: " + surplus;
                }
            } else {
                message = "Échéance payée complètement. Total payé: " + amountPaid +
                        ". Montant dû: " + amountDue;
            }
            remainingAmount = java.math.BigDecimal.ZERO;
        } else if (echeance.getStatus() == EcheanceStatus.PARTIALLY_PAID) {
            isPartialPayment = true;
            message = "Paiement partiel effectué. Total payé: " + amountPaid +
                    ". Montant dû: " + amountDue + ". Reste à payer: " + remainingAmount;
        } else if (amountPaid.compareTo(java.math.BigDecimal.ZERO) > 0) {
            isPartialPayment = true;
            message = "Paiement partiel effectué. Total payé: " + amountPaid +
                    ". Montant dû: " + amountDue + ". Reste à payer: " + remainingAmount;
        } else {
            message = "Aucun paiement effectué. Montant dû: " + amountDue;
            remainingAmount = amountDue;
        }

        return new EcheancePaymentResponse(
                echeance, isPartialPayment, message, amountPaid, remainingAmount);
    }

    @Transactional
    public EcheancePaymentResponse payEcheance(Long echeanceId, java.math.BigDecimal amountPaid) {
        Echeance echeance = echeanceRepository.findById(echeanceId)
                .orElseThrow(() -> new RuntimeException("Echeance not found with id " + echeanceId));

        if (echeance.getStatus() == EcheanceStatus.PAID) {
            throw new RuntimeException("Cette echeance est deja payee");
        }

        boolean hasUnpaidPrevious = echeanceRepository.existsByCreditCreditIdAndEcheanceNumberLessThanAndStatusNot(
                echeance.getCredit().getCreditId(),
                echeance.getEcheanceNumber(),
                EcheanceStatus.PAID);

        if (hasUnpaidPrevious) {
            dispatchRejectedChronologicalEmailSafe(echeance);
            throw new RuntimeException(
                    "Impossible d'effectuer le paiement. Vous devez d'abord régler les échéances précédentes (en retard ou partiellement payées).");
        }

        java.math.BigDecimal currentAmountPaid = echeance.getAmountPaid() != null ? echeance.getAmountPaid()
                : java.math.BigDecimal.ZERO;

        java.math.BigDecimal remainingBeforePayment = echeance.getAmountDue().subtract(currentAmountPaid);

        java.math.BigDecimal newTotalPaid = currentAmountPaid.add(amountPaid);

        java.math.BigDecimal remainingDue = echeance.getAmountDue().subtract(newTotalPaid);

        String message;
        boolean isPartialPayment;

        if (remainingDue.compareTo(java.math.BigDecimal.ZERO) > 0) {
            isPartialPayment = true;
            echeance.setAmountPaid(newTotalPaid);
            echeance.setStatus(EcheanceStatus.PARTIALLY_PAID);
            echeance.setPaidAt(LocalDateTime.now());
            echeanceRepository.save(echeance);
            dispatchPartiallyPaidEmailSafe(echeance);

            log.info("Paiement partiel pour l'echeance {}. Montant payé: {}, Total payé: {}, Reste à payer: {}",
                    echeanceId, amountPaid, newTotalPaid, remainingDue);

            message = "Paiement partiel effectué. Montant payé: " + amountPaid +
                    ". Total payé: " + newTotalPaid +
                    ". Montant dû: " + echeance.getAmountDue() +
                    ". Reste à payer: " + remainingDue;

            return new EcheancePaymentResponse(
                    echeance, isPartialPayment, message, newTotalPaid, remainingDue);
        } else if (remainingDue.compareTo(java.math.BigDecimal.ZERO) < 0) {
            java.math.BigDecimal surplus = remainingDue.abs();
            java.math.BigDecimal amountCounted = amountPaid.subtract(surplus); // Montant comptabilisé de ce paiement
            isPartialPayment = false;

            echeance.setAmountPaid(echeance.getAmountDue());
            markAsPaid(echeance);

            log.info("Paiement avec surplus pour l'echeance {}. Montant payé: {}, Comptabilisé: {}, Surplus: {}",
                    echeanceId, amountPaid, amountCounted, surplus);

            Long creditId = echeance.getCredit().getCreditId();
            List<Echeance> nextEcheances = echeanceRepository.findNextUnpaidEcheancesByCreditId(creditId);

            List<Echeance> remainingEcheances = nextEcheances.stream()
                    .filter(e -> !e.getEcheanceId().equals(echeanceId))
                    .collect(java.util.stream.Collectors.toList());

            StringBuilder surplusMessage = new StringBuilder();
            surplusMessage.append("Échéance payée complètement avec surplus. Dernier paiement: ").append(amountPaid)
                    .append(". Montant comptabilisé: ").append(amountCounted)
                    .append(". Total payé: ").append(echeance.getAmountDue()).append(". ");

            if (!remainingEcheances.isEmpty()) {
                surplusMessage.append("Répartition du surplus (").append(surplus).append(") : ");
                int index = 0;
                while (surplus.compareTo(java.math.BigDecimal.ZERO) > 0 && index < remainingEcheances.size()) {
                    Echeance nextEcheance = remainingEcheances.get(index);
                    java.math.BigDecimal nextCurrentPaid = nextEcheance.getAmountPaid() != null
                            ? nextEcheance.getAmountPaid()
                            : java.math.BigDecimal.ZERO;
                    java.math.BigDecimal nextRemainingDue = nextEcheance.getAmountDue().subtract(nextCurrentPaid);

                    java.math.BigDecimal discount = nextRemainingDue.multiply(new java.math.BigDecimal("0.05"));
                    java.math.BigDecimal discountedRemainingDue = nextRemainingDue.subtract(discount).setScale(2,
                            java.math.RoundingMode.HALF_EVEN);

                    if (surplus.compareTo(discountedRemainingDue) >= 0) {
                        nextEcheance.setAmountDue(nextEcheance.getAmountDue().subtract(discount).setScale(2,
                                java.math.RoundingMode.HALF_EVEN));
                        nextEcheance.setAmountPaid(nextEcheance.getAmountDue());
                        markAsPaid(nextEcheance);
                        surplusMessage.append("[").append(discountedRemainingDue)
                                .append(" avec remise de 5% -> Échéance #")
                                .append(nextEcheance.getEcheanceId()).append("] ");
                        surplus = surplus.subtract(discountedRemainingDue);
                        log.info("Surplus appliqué avec 5% remise. Échéance {} payée complètement. Surplus restant: {}",
                                nextEcheance.getEcheanceId(), surplus);
                    } else {
                        nextEcheance.setAmountPaid(nextCurrentPaid.add(surplus));
                        nextEcheance.setStatus(EcheanceStatus.PARTIALLY_PAID);
                        nextEcheance.setPaidAt(LocalDateTime.now());
                        echeanceRepository.save(nextEcheance);
                        dispatchPartiallyPaidEmailSafe(nextEcheance);
                        surplusMessage.append("[").append(surplus).append(" (partiel, sans remise) -> Échéance #")
                                .append(nextEcheance.getEcheanceId()).append("] ");
                        log.info("Surplus de {} appliqué à l'échéance {}. Paiement partiel sans remise.",
                                surplus, nextEcheance.getEcheanceId());
                        surplus = java.math.BigDecimal.ZERO;
                    }
                    index++;
                }

                if (surplus.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    surplusMessage.append(" | Il reste un surplus non applicable de ").append(surplus)
                            .append(" (aucune autre échéance).");
                    log.info("Surplus global non appliqué de {} sur le crédit {}", surplus, creditId);
                }
                message = surplusMessage.toString().trim();
            } else {
                log.info("Surplus de {} mais aucune échéance suivante trouvée pour le crédit {}", surplus, creditId);
                surplusMessage.append("Surplus : ").append(surplus).append(" (aucune échéance suivante à payer).");
                message = surplusMessage.toString();
            }

            return new EcheancePaymentResponse(
                    echeance, isPartialPayment, message, echeance.getAmountDue(), java.math.BigDecimal.ZERO);
        } else {
            isPartialPayment = false;

            echeance.setAmountPaid(echeance.getAmountDue());
            markAsPaid(echeance);

            log.info("Paiement exact pour l'echeance {}. Montant payé: {}, Total payé: {}",
                    echeanceId, amountPaid, newTotalPaid);

            message = "Paiement complet effectué. Montant payé: " + amountPaid +
                    ". Total payé: " + echeance.getAmountDue() +
                    ". Montant dû: " + echeance.getAmountDue();

            return new EcheancePaymentResponse(
                    echeance, isPartialPayment, message, echeance.getAmountDue(), java.math.BigDecimal.ZERO);
        }
    }
}
