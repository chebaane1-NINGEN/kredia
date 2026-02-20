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
                
                // Mettre à jour amount_paid
                echeance.setAmountPaid(totalPaid);
                
                // Vérifier si le paiement est complet
                if (totalPaid.compareTo(echeance.getAmountDue()) >= 0) {
                    markAsPaid(echeance);
                } else {
                    // Paiement partiel - sauvegarder les changements
                    echeanceRepository.save(echeance);
                }
            }
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
        
        boolean isPartialPayment = false;
        String message = "";
        java.math.BigDecimal remainingAmount = amountDue;
        
        if (echeance.getStatus() == EcheanceStatus.PAID) {
            message = "Échéance payée complètement";
            remainingAmount = java.math.BigDecimal.ZERO;
        } else if (amountPaid.compareTo(java.math.BigDecimal.ZERO) > 0) {
            isPartialPayment = true;
            message = "Paiement partiel effectué. Montant payé: " + amountPaid + 
                ". Reste à payer: " + amountDue;
            remainingAmount = amountDue;
        } else {
            message = "Aucun paiement effectué. Montant dû: " + amountDue;
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

        // Vérifier si le montant saisi est inférieur au montant dû
        if (amountPaid.compareTo(echeance.getAmountDue()) < 0) {
            // Paiement partiel
            java.math.BigDecimal newAmountDue = echeance.getAmountDue().subtract(amountPaid);
            java.math.BigDecimal currentAmountPaid = echeance.getAmountPaid() != null ? 
                echeance.getAmountPaid() : java.math.BigDecimal.ZERO;
            
            echeance.setAmountDue(newAmountDue);
            echeance.setAmountPaid(currentAmountPaid.add(amountPaid));
            Echeance savedEcheance = echeanceRepository.save(echeance);
            
            log.info("Paiement partiel pour l'echeance {}. Montant payé: {}, Reste à payer: {}", 
                echeanceId, amountPaid, newAmountDue);
            
            String message = "Paiement partiel effectué. Montant payé: " + amountPaid + 
                ". Reste à payer: " + newAmountDue;
            
            return new EcheancePaymentResponse(
                savedEcheance, true, message, amountPaid, newAmountDue
            );
        }

        // Paiement complet
        markAsPaid(echeance);
        
        String message = "Paiement complet effectué. Montant payé: " + amountPaid;
        
        return new EcheancePaymentResponse(
            echeance, false, message, amountPaid, java.math.BigDecimal.ZERO
        );
    }
}
