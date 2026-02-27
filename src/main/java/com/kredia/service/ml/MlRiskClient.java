package com.kredia.service.ml;

import com.kredia.dto.ml.RiskFeaturesDto;
import com.kredia.dto.ml.RiskPredictionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
public class MlRiskClient {

    @Value("${ml.risk.service.url}")
    private String url;

    private final RestClient restClient = RestClient.create();

    public double predictRiskScore(RiskFeaturesDto features) {
        try {
            RiskPredictionResponse res = restClient.post()
                    .uri(url)
                    .body(features)
                    .retrieve()
                    .body(RiskPredictionResponse.class);

            return res != null ? res.riskScore() : 0.0;

        } catch (Exception e) {
            // fallback: safe default score
            return 0.0;
        }
    }

}
