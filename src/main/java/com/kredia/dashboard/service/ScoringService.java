package com.kredia.dashboard.service;

import com.kredia.entity.credit.Credit;
import com.kredia.user.entity.User;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class ScoringService {

    /**
     * Calculates a credit score between 0 and 100 based on exact weighted factors.
     * Score = w1*Income + w2*History + w3*DebtRatio + w4*AccountAge
     */
    public double calculateScore(User user, Credit credit) {
        // w1: Income (30%)
        double incomeScore = normalizeIncome(credit.getIncome());
        
        // w2: Repayment History (40%) - Computed from existing echeances if any
        double historyScore = computeHistoryScore(user);
        
        // w3: Debt Ratio (20%) - Simulated based on dependents and requested amount vs income
        double debtRatioScore = computeDebtRatioScore(credit);
        
        // w4: Account Age (10%)
        double ageScore = normalizeAccountAge(user.getCreatedAt());

        double totalScore = (0.30 * incomeScore) + (0.40 * historyScore) + (0.20 * debtRatioScore) + (0.10 * ageScore);
        
        return Math.min(100.0, Math.max(0.0, totalScore));
    }

    /**
     * Probability of Default (PD) using the standard logistic model.
     * PD = 1 / (1 + e^-(alpha + beta * X)) where X is the score.
     */
    public double calculatePD(double score) {
        double alpha = 5.0;  // Intercept
        double beta = -0.1;  // Sensitivity to score improvements
        return 1.0 / (1.0 + Math.exp(-(alpha + beta * score)));
    }

    private double normalizeIncome(BigDecimal income) {
        if (income == null) return 50.0;
        double val = income.doubleValue();
        if (val >= 5000) return 100.0;
        if (val <= 500) return 0.0;
        return ((val - 500) / 4500.0) * 100.0;
    }

    private double computeHistoryScore(User user) {
        // In a real system, we'd query past echeances.
        // For seeding/logic, we'll use a baseline that improves over time or with status.
        return (user.getStatus() == com.kredia.common.UserStatus.VERIFIED) ? 85.0 : 60.0;
    }

    private double computeDebtRatioScore(Credit credit) {
        if (credit.getIncome() == null || credit.getAmount() == 0) return 70.0;
        double monthlyPayment = credit.getAmount() / credit.getTermMonths();
        double ratio = monthlyPayment / credit.getIncome().doubleValue();
        
        // Ideal ratio < 30%
        if (ratio <= 0.3) return 100.0;
        if (ratio >= 0.7) return 0.0;
        return (1.0 - (ratio - 0.3) / 0.4) * 100.0;
    }

    private double normalizeAccountAge(LocalDateTime createdAt) {
        if (createdAt == null) return 0.0;
        long days = ChronoUnit.DAYS.between(createdAt, LocalDateTime.now());
        if (days >= 730) return 100.0; // 2 years = max score
        return (days / 730.0) * 100.0;
    }
}
