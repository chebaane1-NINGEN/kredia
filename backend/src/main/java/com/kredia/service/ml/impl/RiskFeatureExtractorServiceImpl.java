package com.kredia.service.ml.impl;

import com.kredia.dto.ml.RiskFeaturesDto;
import com.kredia.enums.CreditStatus;
import com.kredia.repository.CreditRepository;
import com.kredia.repository.EcheanceRepository;
import com.kredia.repository.ReclamationRepository;
import com.kredia.repository.WalletRepository;
import com.kredia.service.ml.RiskFeatureExtractorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RiskFeatureExtractorServiceImpl implements RiskFeatureExtractorService {

    private final ReclamationRepository reclamationRepository;
    private final WalletRepository walletRepository;
    private final CreditRepository creditRepository;
    private final EcheanceRepository echeanceRepository;

    @Override
    public RiskFeaturesDto extract(Long userId, String subject, String description, String status, String priority) {
        String safeSubject = subject == null ? "" : subject.trim();
        String safeDescription = description == null ? "" : description.trim();
        String fullMessage = (safeSubject + " " + safeDescription).trim();

        long complaintsLast90dLong = reclamationRepository.countByUserIdAndCreatedAtAfter(
                userId,
                LocalDateTime.now().minusDays(90)
        );
        int complaintsLast90d = complaintsLast90dLong > Integer.MAX_VALUE
                ? Integer.MAX_VALUE
                : (int) complaintsLast90dLong;

        int messageLen = fullMessage.length();

        var walletOpt = walletRepository.findByUser_Id(userId);
        double walletBalance = walletOpt
                .map(w -> w.getBalance() != null ? w.getBalance().doubleValue() : 0.0)
                .orElse(0.0);
        double walletFrozenBalance = walletOpt
                .map(w -> w.getFrozenBalance() != null ? w.getFrozenBalance().doubleValue() : 0.0)
                .orElse(0.0);

        int creditHasActive = creditRepository.existsByUser_IdAndStatusIn(
                userId,
                List.of(CreditStatus.ACTIVE, CreditStatus.APPROVED)
        ) ? 1 : 0;

        long missedInstallmentsLong = echeanceRepository.countLateCreditByUserId(userId);
        int creditInstallmentsMissed = missedInstallmentsLong > Integer.MAX_VALUE
                ? Integer.MAX_VALUE
                : (int) missedInstallmentsLong;
        int creditDaysLate = Math.max(0, echeanceRepository.maxCreditDaysLateByUserId(userId));

        return new RiskFeaturesDto(
                complaintsLast90d,
                messageLen,
                walletBalance,
                walletFrozenBalance,
                creditHasActive,
                creditInstallmentsMissed,
                creditDaysLate
        );
    }
}
