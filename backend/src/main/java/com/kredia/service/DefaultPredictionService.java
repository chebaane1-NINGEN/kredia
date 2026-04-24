package com.kredia.service;

import com.kredia.dto.ml.DefaultPredictionRequest;
import com.kredia.dto.ml.DefaultPredictionResponse;
import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.Echeance;
import com.kredia.enums.EcheanceStatus;
import com.kredia.repository.CreditRepository;
import com.kredia.repository.EcheanceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;

@Service
public class DefaultPredictionService {

    private final RestTemplate restTemplate;
    private final CreditRepository creditRepository;
    private final EcheanceRepository echeanceRepository;

    @Value("${ml.default-prediction.url:http://localhost:8001}")
    private String mlServiceUrl;

    public DefaultPredictionService(RestTemplate restTemplate,
                                    CreditRepository creditRepository,
                                    EcheanceRepository echeanceRepository) {
        this.restTemplate = restTemplate;
        this.creditRepository = creditRepository;
        this.echeanceRepository = echeanceRepository;
    }

    public DefaultPredictionResponse predictForCredit(Long creditId) {
        Credit credit = creditRepository.findById(creditId)
                .orElseThrow(() -> new RuntimeException("Crédit introuvable: " + creditId));

        List<Echeance> echeances = echeanceRepository.findByCreditCreditId(creditId);

        long totalEcheances = echeances.size();
        long overdueCount = echeances.stream()
                .filter(e -> e.getStatus() == EcheanceStatus.OVERDUE)
                .count();
        long partialCount = echeances.stream()
                .filter(e -> e.getStatus() == EcheanceStatus.PARTIALLY_PAID)
                .count();

        double overdueRatio = totalEcheances > 0 ? (double) overdueCount / totalEcheances : 0.0;
        double partialRatio = totalEcheances > 0 ? (double) partialCount / totalEcheances : 0.0;

        DefaultPredictionRequest request = new DefaultPredictionRequest(
                credit.getAmount(),
                credit.getIncome().floatValue(),
                credit.getDependents(),
                credit.getInterestRate(),
                credit.getTermMonths(),
                credit.getRepaymentType().name(),
                overdueRatio,
                partialRatio
        );

        String url = mlServiceUrl + "/predict/" + creditId;
        DefaultPredictionResponse raw = restTemplate.postForObject(url, request, DefaultPredictionResponse.class);
        return translateResponse(raw);
    }

    /** Translate French ML output to English */
    private DefaultPredictionResponse translateResponse(DefaultPredictionResponse raw) {
        if (raw == null) return null;

        String riskLabel = translateRiskLabel(raw.riskLabel());
        String recommendation = translateRecommendation(raw.recommendation());

        return new DefaultPredictionResponse(
                raw.creditId(),
                raw.defaultProbability(),
                riskLabel,
                raw.riskLevel(),   // LOW / MEDIUM / HIGH — already English
                recommendation
        );
    }

    private String translateRiskLabel(String label) {
        if (label == null) return label;
        return switch (label.toUpperCase().replace(" ", "_")) {
            case "RISQUE_FAIBLE",  "FAIBLE"  -> "LOW_RISK";
            case "RISQUE_MOYEN",   "MOYEN"   -> "MEDIUM_RISK";
            case "RISQUE_ELEVE",   "ELEVE",
                 "RISQUE_ÉLEVÉ",   "ÉLEVÉ"   -> "HIGH_RISK";
            case "RISQUE_CRITIQUE","CRITIQUE" -> "CRITICAL_RISK";
            default -> label;
        };
    }

    private String translateRecommendation(String rec) {
        if (rec == null) return rec;
        String t = rec.trim();

        // Exact matches first
        if (t.equals("Crédit approuvable. Profil financier sain."))
            return "Approvable credit. Healthy financial profile.";
        if (t.equals("Crédit approuvable avec surveillance."))
            return "Approvable credit with monitoring.";
        if (t.equals("Crédit risqué. Analyse approfondie recommandée."))
            return "Risky credit. In-depth analysis recommended.";
        if (t.equals("Crédit très risqué. Refus recommandé."))
            return "Very risky credit. Rejection recommended.";
        if (t.equals("Profil à risque élevé. Refus fortement recommandé."))
            return "High-risk profile. Rejection strongly recommended.";

        // Fallback: keyword-based translation (handles minor variations)
        String lower = t.toLowerCase();
        if (lower.contains("approuvable") && lower.contains("sain"))
            return "Approvable credit. Healthy financial profile.";
        if (lower.contains("approuvable") && lower.contains("surveillance"))
            return "Approvable credit with monitoring.";
        if (lower.contains("risqué") && lower.contains("approfondie"))
            return "Risky credit. In-depth analysis recommended.";
        if (lower.contains("très risqué") || (lower.contains("risqué") && lower.contains("refus")))
            return "Very risky credit. Rejection recommended.";
        if (lower.contains("risque élevé") || lower.contains("risque eleve") || lower.contains("fortement"))
            return "High-risk profile. Rejection strongly recommended.";

        return rec; // return as-is if nothing matched
    }
}
