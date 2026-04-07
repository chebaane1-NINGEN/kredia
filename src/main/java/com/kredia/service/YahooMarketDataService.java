package com.kredia.service;

import com.kredia.enums.RiskLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class YahooMarketDataService {

    private static final Logger logger = LoggerFactory.getLogger(YahooMarketDataService.class);

    private final RestTemplate restTemplate;

    public YahooMarketDataService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @SuppressWarnings("unchecked")
    public Optional<EvaluatedAsset> evaluateAsset(String symbol) {
        try {
            String normalizedSymbol = symbol == null ? "" : symbol.trim().toUpperCase();
            if (normalizedSymbol.isBlank()) {
                logger.debug("Yahoo evaluateAsset ignoré: symbole vide");
                return Optional.empty();
            }

            String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + normalizedSymbol + "?interval=1d&range=6mo";
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Accept", "application/json");

                ResponseEntity<Map<String, Object>> responseEntity = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<>() {
                    }
            );

            Map<String, Object> response = responseEntity.getBody();
            if (response == null) {
                logger.debug("Yahoo evaluateAsset {}: réponse vide", normalizedSymbol);
                return Optional.empty();
            }

            Map<String, Object> chart = (Map<String, Object>) response.get("chart");
            if (chart == null) {
                logger.debug("Yahoo evaluateAsset {}: champ chart absent", normalizedSymbol);
                return Optional.empty();
            }

            Object error = chart.get("error");
            if (error != null) {
                logger.debug("Yahoo evaluateAsset {}: chart.error={}", normalizedSymbol, error);
                return Optional.empty();
            }

            List<Object> result = (List<Object>) chart.get("result");
            if (result == null || result.isEmpty()) {
                logger.debug("Yahoo evaluateAsset {}: result vide", normalizedSymbol);
                return Optional.empty();
            }

            Map<String, Object> firstResult = (Map<String, Object>) result.get(0);

            Map<String, Object> meta = (Map<String, Object>) firstResult.get("meta");
            BigDecimal currentPrice = toBigDecimal(meta != null ? meta.get("regularMarketPrice") : null);
            if (currentPrice == null || currentPrice.compareTo(BigDecimal.ZERO) <= 0) {
                logger.debug("Yahoo evaluateAsset {}: regularMarketPrice invalide", normalizedSymbol);
                return Optional.empty();
            }

            Map<String, Object> indicators = (Map<String, Object>) firstResult.get("indicators");
            if (indicators == null) {
                logger.debug("Yahoo evaluateAsset {}: indicators absent", normalizedSymbol);
                return Optional.empty();
            }

            List<Object> quoteList = (List<Object>) indicators.get("quote");
            if (quoteList == null || quoteList.isEmpty()) {
                logger.debug("Yahoo evaluateAsset {}: quote vide", normalizedSymbol);
                return Optional.empty();
            }

            Map<String, Object> quote = (Map<String, Object>) quoteList.get(0);
            List<Double> closes = toDoubleList((List<Object>) quote.get("close"));
            List<Double> volumes = toDoubleList((List<Object>) quote.get("volume"));

            if (closes.size() < 70) {
                logger.debug("Yahoo evaluateAsset {}: historique insuffisant ({} closes)", normalizedSymbol, closes.size());
                return Optional.empty();
            }

            double momentum20d = computeMomentum(closes, 20);
            double momentum60d = computeMomentum(closes, 60);
            double volatilityAnn = computeAnnualizedVolatility(closes);
            double maxDrawdown = computeMaxDrawdown(closes);
            double avgVolume20d = computeAverageVolume(volumes, 20);

            RiskLevel derivedRiskLevel = mapVolatilityToRiskLevel(volatilityAnn);

            return Optional.of(new EvaluatedAsset(
                    normalizedSymbol,
                    currentPrice.setScale(6, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(momentum20d).setScale(6, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(momentum60d).setScale(6, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(volatilityAnn).setScale(6, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(maxDrawdown).setScale(6, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(avgVolume20d).setScale(2, RoundingMode.HALF_UP),
                    derivedRiskLevel
            ));
        } catch (Exception e) {
            logger.debug("Yahoo evaluateAsset {}: exception {}", symbol, e.getMessage());
            return Optional.empty();
        }
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return new BigDecimal(value.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private List<Double> toDoubleList(List<Object> values) {
        List<Double> result = new ArrayList<>();
        if (values == null) {
            return result;
        }

        for (Object value : values) {
            if (value == null) {
                continue;
            }
            try {
                double parsed = Double.parseDouble(value.toString());
                if (!Double.isNaN(parsed) && !Double.isInfinite(parsed)) {
                    result.add(parsed);
                }
            } catch (Exception ignored) {
                // Ignore malformed values
            }
        }

        return result;
    }

    private double computeMomentum(List<Double> closes, int days) {
        if (closes.size() <= days) {
            return 0.0;
        }

        double past = closes.get(closes.size() - 1 - days);
        double last = closes.get(closes.size() - 1);
        if (past <= 0) {
            return 0.0;
        }
        return (last / past) - 1.0;
    }

    private double computeAnnualizedVolatility(List<Double> closes) {
        if (closes.size() < 2) {
            return 0.0;
        }

        List<Double> returns = new ArrayList<>();
        for (int i = 1; i < closes.size(); i++) {
            double prev = closes.get(i - 1);
            double current = closes.get(i);
            if (prev > 0) {
                returns.add((current / prev) - 1.0);
            }
        }

        if (returns.isEmpty()) {
            return 0.0;
        }

        double mean = returns.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double variance = returns.stream()
                .mapToDouble(r -> Math.pow(r - mean, 2))
                .average()
                .orElse(0.0);

        return Math.sqrt(variance) * Math.sqrt(252);
    }

    private double computeMaxDrawdown(List<Double> closes) {
        if (closes.isEmpty()) {
            return 0.0;
        }

        double peak = closes.get(0);
        double maxDrawdown = 0.0;

        for (double close : closes) {
            if (close > peak) {
                peak = close;
            }
            if (peak > 0) {
                double drawdown = (peak - close) / peak;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            }
        }

        return maxDrawdown;
    }

    private double computeAverageVolume(List<Double> volumes, int days) {
        if (volumes.isEmpty()) {
            return 0.0;
        }

        int start = Math.max(0, volumes.size() - days);
        List<Double> tail = volumes.subList(start, volumes.size());
        return tail.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private RiskLevel mapVolatilityToRiskLevel(double volatilityAnn) {
        if (volatilityAnn <= 0.20) {
            return RiskLevel.LOW;
        }
        if (volatilityAnn <= 0.35) {
            return RiskLevel.MEDIUM;
        }
        if (volatilityAnn <= 0.50) {
            return RiskLevel.HIGH;
        }
        return RiskLevel.VERY_HIGH;
    }

    public static class EvaluatedAsset {
        private final String symbol;
        private final BigDecimal currentPrice;
        private final BigDecimal momentum20d;
        private final BigDecimal momentum60d;
        private final BigDecimal volatilityAnn;
        private final BigDecimal maxDrawdown;
        private final BigDecimal avgVolume20d;
        private final RiskLevel riskLevel;

        public EvaluatedAsset(String symbol,
                              BigDecimal currentPrice,
                              BigDecimal momentum20d,
                              BigDecimal momentum60d,
                              BigDecimal volatilityAnn,
                              BigDecimal maxDrawdown,
                              BigDecimal avgVolume20d,
                              RiskLevel riskLevel) {
            this.symbol = symbol;
            this.currentPrice = currentPrice;
            this.momentum20d = momentum20d;
            this.momentum60d = momentum60d;
            this.volatilityAnn = volatilityAnn;
            this.maxDrawdown = maxDrawdown;
            this.avgVolume20d = avgVolume20d;
            this.riskLevel = riskLevel;
        }

        public String getSymbol() {
            return symbol;
        }

        public BigDecimal getCurrentPrice() {
            return currentPrice;
        }

        public BigDecimal getMomentum20d() {
            return momentum20d;
        }

        public BigDecimal getMomentum60d() {
            return momentum60d;
        }

        public BigDecimal getVolatilityAnn() {
            return volatilityAnn;
        }

        public BigDecimal getMaxDrawdown() {
            return maxDrawdown;
        }

        public BigDecimal getAvgVolume20d() {
            return avgVolume20d;
        }

        public RiskLevel getRiskLevel() {
            return riskLevel;
        }
    }
}
