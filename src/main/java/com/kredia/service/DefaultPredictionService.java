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

        // Ratio overdues / total échéances (0.0 à 1.0)
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
        return restTemplate.postForObject(url, request, DefaultPredictionResponse.class);
    }
}
