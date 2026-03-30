package com.kredia.service.ml.impl;

import com.kredia.dto.ml.RiskFeaturesDto;
import com.kredia.repository.EcheanceRepository;
import com.kredia.repository.ReclamationRepository;
import com.kredia.repository.TransactionRepository;
import com.kredia.service.ml.RiskFeatureExtractorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class RiskFeatureExtractorServiceImpl implements RiskFeatureExtractorService {

    private final ReclamationRepository reclamationRepository;
    private final TransactionRepository transactionRepository;
    private final EcheanceRepository echeanceRepository;

    @Override
    public RiskFeaturesDto extract(Long userId, String subject, String description, String status, String priority) {

        String safeSubject = subject == null ? "" : subject.trim();
        String safeDescription = description == null ? "" : description.trim();
        String safeStatus = status == null ? "OPEN" : status;
        String safePriority = priority == null ? "MEDIUM" : priority;

        long pastReclamationsLong = reclamationRepository.countByUserId(userId);
        int pastReclamations = pastReclamationsLong > Integer.MAX_VALUE
                ? Integer.MAX_VALUE
                : (int) pastReclamationsLong;

        long duplicateLong = reclamationRepository.countDuplicateCandidates(userId, safeSubject, safeDescription);
        int duplicateCount = duplicateLong > Integer.MAX_VALUE
                ? Integer.MAX_VALUE
                : (int) duplicateLong;

        BigDecimal latestCompletedAmount = transactionRepository.findLatestCompletedAmountByUserId(userId);
        double transactionAmount = latestCompletedAmount != null ? latestCompletedAmount.doubleValue() : 0.0;

        int lateCredit = echeanceRepository.countLateCreditByUserId(userId) > 0 ? 1 : 0;

        return new RiskFeaturesDto(
                safeSubject,
                safeDescription,
                safeStatus,
                safePriority,
                duplicateCount,
                pastReclamations,
                transactionAmount,
                lateCredit
        );
    }
}
