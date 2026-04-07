package com.kredia.service.impl;

import com.kredia.dto.reclamation.RiskFeatures;
import com.kredia.repository.ReclamationRepository;
import com.kredia.service.RiskFeatureExtractor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RiskFeatureExtractorImpl implements RiskFeatureExtractor {

    private final ReclamationRepository reclamationRepository;

    // In Step 6 we will read real Wallet/Credit data from your team modules
    // For now we keep wallet/credit features as 0 or false (POC)
    @Override
    public RiskFeatures extractForNewComplaint(Long userId, String description) {
        LocalDateTime after = LocalDateTime.now().minusDays(90);
        long cnt = reclamationRepository.countByUserIdAndCreatedAtAfter(userId, after);

        int msgLen = description != null ? description.length() : 0;

        return RiskFeatures.builder()
                .userId(userId)
                .complaintsLast90d((int) cnt)
                .messageLen(msgLen)
                .walletBalance(0.0)
                .walletFrozenBalance(0.0)
                .creditHasActive(false)
                .creditInstallmentsMissed(0)
                .creditDaysLate(0)
                .build();
    }
}
