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
            // Calculer le montant total des transactions liées à cette échéance
            java.math.BigDecimal totalPaid = echeanceRepository.sumTransactionAmountsByEcheanceId(echeance.getEcheanceId());
            
            if (totalPaid != null && totalPaid.compareTo(java.math.BigDecimal.ZERO) > 0) {
                log.info("Echeance {} has total transactions amount: {}", echeance.getEcheanceId(), totalPaid);
                
                // IMPORTANT: amount_paid ne doit JAMAIS dépasser amount_due
                if (totalPaid.compareTo(echeance.getAmountDue()) >= 0) {
                    // Paiement complet ou avec surplus - plafonner à amount_due
                    echeance.setAmountPaid(echeance.getAmountDue());
                    markAsPaid(echeance);
                } else {
                    // Paiement partiel
                    echeance.setAmountPaid(totalPaid);
                    echeanceRepository.save(echeance);
                }
            }
        }
    }

    private void markAsPaid(Echeance echeance) {
        echeance.setStatus(EcheanceStatus.PAID);
        // S'assurer que amount_paid ne dépasse jamais amount_due
        if (echeance.getAmountPaid() == null || echeance.getAmountPaid().compareTo(echeance.getAmountDue()) != 0) {
            echeance.setAmountPaid(echeance.getAmountDue());
        }
        echeance.setPaidAt(LocalDateTime.now());
        echeanceRepository.save(echeance);
        log.info("Echeance {} marked as PAID with amount_paid: {}", echeance.getEcheanceId(), echeance.getAmountPaid());

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
    
    private EcheancePaymentResponse buildPaymentResponse(Echeance echeance) {
        java.math.BigDecimal amountPaid = echeance.getAmountPaid() != null ? 
            echeance.getAmountPaid() : java.math.BigDecimal.ZERO;
        java.math.BigDecimal amountDue = echeance.getAmountDue();
        
        // Calculer le reste à payer (amount_due - amount_paid)
        java.math.BigDecimal remainingAmount = amountDue.subtract(amountPaid);
        
        boolean isPartialPayment = false;
        String message = "";
        
        if (echeance.getStatus() == EcheanceStatus.PAID) {
            // Pour les échéances payées, vérifier s'il y a un surplus via les transactions
            java.math.BigDecimal totalTransactions = echeanceRepository.sumTransactionAmountsByEcheanceId(echeance.getEcheanceId());
            
            if (totalTransactions != null && totalTransactions.compareTo(amountDue) > 0) {
                java.math.BigDecimal surplus = totalTransactions.subtract(amountDue);
                
                // Récupérer le montant de la dernière transaction
                java.math.BigDecimal lastTransactionAmount = echeanceRepository.getLastTransactionAmountByEcheanceId(echeance.getEcheanceId());
                
                if (lastTransactionAmount != null) {
                    // Calculer le montant comptabilisé de la dernière transaction
                    java.math.BigDecimal amountCountedFromLast = lastTransactionAmount.subtract(surplus);
                    
                    message = "Échéance payée complètement avec surplus. Dernier paiement: " + lastTransactionAmount + 
                        ". Montant comptabilisé: " + amountCountedFromLast + 
                        ". Total payé: " + amountPaid + 
                        ". Surplus: " + surplus;
                } else {
                    message = "Échéance payée complètement avec surplus. Paiement total des transactions: " + totalTransactions + 
                        ". Montant comptabilisé: " + amountPaid + 
                        ". Montant dû: " + amountDue + 
                        ". Surplus: " + surplus;
                }
            } else {
                message = "Échéance payée complètement. Total payé: " + amountPaid + 
                    ". Montant dû: " + amountDue;
            }
            remainingAmount = java.math.BigDecimal.ZERO;
        } else if (amountPaid.compareTo(java.math.BigDecimal.ZERO) > 0) {
            isPartialPayment = true;
            message = "Paiement partiel effectué. Total payé: " + amountPaid + 
                ". Montant dû: " + amountDue + ". Reste à payer: " + remainingAmount;
        } else {
            message = "Aucun paiement effectué. Montant dû: " + amountDue;
            remainingAmount = amountDue;
        }
        
        return new EcheancePaymentResponse(
            echeance, isPartialPayment, message, amountPaid, remainingAmount
        );
    }

    @Transactional
    public EcheancePaymentResponse payEcheance(Long echeanceId, java.math.BigDecimal amountPaid) {
        Echeance echeance = echeanceRepository.findById(echeanceId)
                .orElseThrow(() -> new RuntimeException("Echeance not found with id " + echeanceId));

        if (echeance.getStatus() == EcheanceStatus.PAID) {
            throw new RuntimeException("Cette echeance est deja payee");
        }

        // Calculer le montant déjà payé
        java.math.BigDecimal currentAmountPaid = echeance.getAmountPaid() != null ? 
            echeance.getAmountPaid() : java.math.BigDecimal.ZERO;
        
        // Calculer le reste à payer avant ce paiement
        java.math.BigDecimal remainingBeforePayment = echeance.getAmountDue().subtract(currentAmountPaid);
        
        // Calculer le nouveau total payé
        java.math.BigDecimal newTotalPaid = currentAmountPaid.add(amountPaid);
        
        // Calculer le reste à payer après ce paiement
        java.math.BigDecimal remainingDue = echeance.getAmountDue().subtract(newTotalPaid);
        
        String message;
        boolean isPartialPayment;
        
        if (remainingDue.compareTo(java.math.BigDecimal.ZERO) > 0) {
            // Paiement partiel - il reste encore à payer
            isPartialPayment = true;
            echeance.setAmountPaid(newTotalPaid);
            echeanceRepository.save(echeance);
            
            log.info("Paiement partiel pour l'echeance {}. Montant payé: {}, Total payé: {}, Reste à payer: {}", 
                echeanceId, amountPaid, newTotalPaid, remainingDue);
            
            message = "Paiement partiel effectué. Montant payé: " + amountPaid + 
                ". Total payé: " + newTotalPaid + 
                ". Montant dû: " + echeance.getAmountDue() + 
                ". Reste à payer: " + remainingDue;
            
            return new EcheancePaymentResponse(
                echeance, isPartialPayment, message, newTotalPaid, remainingDue
            );
        } else if (remainingDue.compareTo(java.math.BigDecimal.ZERO) < 0) {
            // Paiement avec surplus
            java.math.BigDecimal surplus = remainingDue.abs();
            java.math.BigDecimal amountCounted = amountPaid.subtract(surplus); // Montant comptabilisé de ce paiement
            isPartialPayment = false;
            
            // IMPORTANT: amount_paid ne doit JAMAIS dépasser amount_due
            echeance.setAmountPaid(echeance.getAmountDue());
            markAsPaid(echeance);
            
            log.info("Paiement avec surplus pour l'echeance {}. Montant payé: {}, Comptabilisé: {}, Surplus: {}", 
                echeanceId, amountPaid, amountCounted, surplus);
            
            message = "Échéance payée complètement avec surplus. Dernier paiement: " + amountPaid + 
                ". Montant comptabilisé: " + amountCounted + 
                ". Total payé: " + echeance.getAmountDue() + 
                ". Surplus: " + surplus;
            
            return new EcheancePaymentResponse(
                echeance, isPartialPayment, message, echeance.getAmountDue(), java.math.BigDecimal.ZERO
            );
        } else {
            // Paiement exact
            isPartialPayment = false;
            
            echeance.setAmountPaid(echeance.getAmountDue());
            markAsPaid(echeance);
            
            log.info("Paiement exact pour l'echeance {}. Montant payé: {}, Total payé: {}", 
                echeanceId, amountPaid, newTotalPaid);
            
            message = "Paiement complet effectué. Montant payé: " + amountPaid + 
                ". Total payé: " + echeance.getAmountDue() + 
                ". Montant dû: " + echeance.getAmountDue();
            
            return new EcheancePaymentResponse(
                echeance, isPartialPayment, message, echeance.getAmountDue(), java.math.BigDecimal.ZERO
            );
        }
    }
}
