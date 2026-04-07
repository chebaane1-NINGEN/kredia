package com.kredia.service.impl;

import com.kredia.dto.reclamation.RiskFeatures;
import com.kredia.service.RiskScoringService;
import org.springframework.stereotype.Service;

@Service
public class MockRiskScoringService implements RiskScoringService {

    @Override
    public double score(RiskFeatures f) {
        double score = 10;

        // Repeat complaints -> higher escalation risk
        score += Math.min(40, f.complaintsLast90d() * 10);

        // long angry message typically indicates urgency
        if (f.messageLen() > 300) score += 15;
        if (f.messageLen() > 800) score += 10;

        // credit signals
        if (f.creditHasActive()) score += 10;
        score += Math.min(15, f.creditInstallmentsMissed() * 7);
        score += Math.min(15, f.creditDaysLate() * 0.5);

        // wallet signals
        if (f.walletFrozenBalance() > 0) score += 10;

        // clamp 0..100
        if (score < 0) score = 0;
        if (score > 100) score = 100;
        return score;
    }
}
