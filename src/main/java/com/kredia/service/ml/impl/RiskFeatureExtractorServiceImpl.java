package com.kredia.service.ml.impl;

import com.kredia.dto.ml.RiskFeaturesDto;
import com.kredia.repository.ReclamationRepository;
import com.kredia.service.ml.RiskFeatureExtractorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RiskFeatureExtractorServiceImpl implements RiskFeatureExtractorService {

    private final ReclamationRepository reclamationRepository;

    // Later: inject WalletRepository/CreditRepository/EcheanceRepository
    // private final WalletRepository walletRepository;
    // private final CreditRepository creditRepository;
    // private final EcheanceRepository echeanceRepository;

    @Override
    public RiskFeaturesDto extract(Long userId, String description) {

        int msgLen = description == null ? 0 : description.length();

        long count90 = reclamationRepository.countByUserIdAndCreatedAtAfter(
                userId,
                LocalDateTime.now().minusDays(90)
        );

        // For now (until you wire Wallet/Credit repos):
        double walletBalance = 0.0;
        double walletFrozen = 0.0;
        int creditHasActive = 0;
        int missed = 0;
        int daysLate = 0;

        return new RiskFeaturesDto(
                (int) count90,
                msgLen,
                walletBalance,
                walletFrozen,
                creditHasActive,
                missed,
                daysLate
        );
    }
}
