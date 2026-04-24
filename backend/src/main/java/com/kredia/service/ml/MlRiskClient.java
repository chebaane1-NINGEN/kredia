package com.kredia.service.ml;

import com.kredia.dto.ml.RiskFeaturesDto;
import com.kredia.dto.ml.RiskPredictionResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class MlRiskClient {

    private static final Logger log = LoggerFactory.getLogger(MlRiskClient.class);

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

            if (res == null) {
                log.warn("ML /predict returned null body for payload: {}", features);
                return 0.0;
            }

            log.info("ML /predict success: score={}, level={}", res.riskScore(), res.riskLevel());
            return res.riskScore();

        } catch (RestClientResponseException e) {
            log.error("ML /predict HTTP error {} body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            return 0.0;
        } catch (Exception e) {
            log.error("ML /predict call failed for payload: {}", features, e);
            return 0.0;
        }
    }

}
