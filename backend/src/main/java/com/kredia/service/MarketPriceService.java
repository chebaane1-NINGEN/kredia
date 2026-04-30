package com.kredia.service;

import com.kredia.entity.investment.InvestmentAsset;
import com.kredia.enums.AssetCategory;
import com.kredia.repository.InvestmentAssetRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class MarketPriceService {

    private static final Logger logger = LoggerFactory.getLogger(MarketPriceService.class);

    private final RestTemplate restTemplate;
    private final InvestmentAssetRepository assetRepository;

    @Value("${market.alphavantage.api-key:}")
    private String alphaVantageApiKey;

    public MarketPriceService(RestTemplate restTemplate, InvestmentAssetRepository assetRepository) {
        this.restTemplate = restTemplate;
        this.assetRepository = assetRepository;
    }

    /**
     * Retourne une série de prix de clôture pour un symbole depuis Yahoo Finance.
     * Ex: range=1d, interval=1m ou range=1mo, interval=1d
     */
    @SuppressWarnings("unchecked")
    public List<BigDecimal> getHistoricalPrices(String symbol, String range, String interval) {
        try {
            String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol +
                    "?range=" + (range == null ? "1d" : range) + "&interval=" + (interval == null ? "1m" : interval);

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            headers.set("Accept", "application/json");

            ResponseEntity<Map<String, Object>> responseEntity = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> response = responseEntity.getBody();
            if (response == null) throw new RuntimeException("Yahoo response empty");

            Map<String, Object> chart = (Map<String, Object>) response.get("chart");
            List<Object> result = (List<Object>) chart.get("result");
            Map<String, Object> first = (Map<String, Object>) result.get(0);
            Map<String, Object> indicators = (Map<String, Object>) first.get("indicators");
            List<Object> quotes = (List<Object>) indicators.get("quote");
            Map<String, Object> quote0 = (Map<String, Object>) quotes.get(0);
            List<Object> closes = (List<Object>) quote0.get("close");

            return closes.stream()
                    .filter(o -> o != null)
                    .map(o -> new BigDecimal(o.toString()))
                    .toList();
        } catch (Exception e) {
            logger.error("Yahoo historical error for {}: {}", symbol, e.getMessage());
            throw new RuntimeException("Impossible de récupérer l'historique pour " + symbol + " : " + e.getMessage());
        }
    }

    /**
     * Recherche Yahoo Finance sur les symboles/noms d'actifs.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchAssets(String query, int limit) {
        try {
            if (query == null || query.trim().isEmpty()) {
                return List.of();
            }

            URI uri = UriComponentsBuilder
                    .fromHttpUrl("https://query1.finance.yahoo.com/v1/finance/search")
                    .queryParam("q", query.trim())
                    .queryParam("quotesCount", Math.max(1, Math.min(limit, 12)))
                    .queryParam("newsCount", 0)
                    .build(true)
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Accept", "application/json");

            ResponseEntity<Map<String, Object>> responseEntity = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> response = responseEntity.getBody();
            if (response == null) {
                return List.of();
            }

            Object quotesObject = response.get("quotes");
            if (!(quotesObject instanceof List<?> quotes)) {
                return List.of();
            }

            return quotes.stream()
                    .filter(item -> item instanceof Map<?, ?>)
                    .map(item -> (Map<String, Object>) item)
                    .map(this::normalizeSearchResult)
                    .toList();
        } catch (Exception e) {
            logger.error("Yahoo search error for {}: {}", query, e.getMessage());
            throw new RuntimeException("Impossible de rechercher les actifs pour '" + query + "' : " + e.getMessage());
        }
    }

    private Map<String, Object> normalizeSearchResult(Map<String, Object> quote) {
        Map<String, Object> normalized = new java.util.LinkedHashMap<>();
        normalized.put("symbol", quote.getOrDefault("symbol", ""));
        normalized.put("shortName", quote.getOrDefault("shortname", quote.getOrDefault("symbol", "")));
        normalized.put("longName", quote.getOrDefault("longname", quote.getOrDefault("shortname", quote.getOrDefault("symbol", ""))));
        normalized.put("exchange", quote.getOrDefault("exchDisp", quote.getOrDefault("exchange", "")));
        normalized.put("type", quote.getOrDefault("quoteType", quote.getOrDefault("typeDisp", "")));
        normalized.put("currency", quote.getOrDefault("currency", ""));
        normalized.put("marketPrice", quote.get("regularMarketPrice"));
        return normalized;
    }

    /**
     * Fetches the current market price for the given asset symbol.
     * - CRYPTO  → Binance API (no API key required)
     * - STOCK / ETF / BOND / COMMODITY → Yahoo Finance API (no API key required)
     */
    public BigDecimal getCurrentPrice(String symbol) {
        String upperSymbol = symbol.toUpperCase();

        Optional<InvestmentAsset> assetOpt = assetRepository.findBySymbol(upperSymbol);

        if (assetOpt.isPresent() && assetOpt.get().getCategory() != AssetCategory.CRYPTO) {
            // Non-crypto asset → use Yahoo Finance
            return getYahooPrice(upperSymbol);
        }

        // Default: try Binance (crypto). If it fails, fallback to Yahoo Finance.
        try {
            return getCryptoPrice(upperSymbol);
        } catch (Exception e) {
            logger.debug("Binance failed for {}, falling back to Yahoo Finance: {}", upperSymbol, e.getMessage());
            return getYahooPrice(upperSymbol);
        }
    }

    // ==================== Binance (Crypto) ====================

    @SuppressWarnings("unchecked")
    private BigDecimal getCryptoPrice(String symbol) {
        String url = "https://api.binance.com/api/v3/ticker/price?symbol=" + symbol + "USDT";
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response != null && response.containsKey("price")) {
            return new BigDecimal(response.get("price").toString());
        }
        throw new RuntimeException("Binance: impossible de récupérer le prix pour le symbole: " + symbol);
    }

    // ==================== Yahoo Finance (Stocks / ETF / Bonds / Commodities) ====================

    @SuppressWarnings("unchecked")
    private BigDecimal getYahooPrice(String symbol) {
        try {
            String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + symbol + "?interval=1d&range=1d";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Accept", "application/json");

            ResponseEntity<Map<String, Object>> responseEntity = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {}
            );

            Map<String, Object> response = responseEntity.getBody();
            if (response == null) {
                throw new RuntimeException("Yahoo Finance: réponse vide pour " + symbol);
            }

            Map<String, Object> chart = (Map<String, Object>) response.get("chart");
            if (chart == null) {
                throw new RuntimeException("Yahoo Finance: champ chart absent pour " + symbol);
            }

            Object error = chart.get("error");
            if (error != null) {
                throw new RuntimeException("Yahoo Finance: erreur pour " + symbol + " - " + error);
            }

            List<Object> result = (List<Object>) chart.get("result");
            if (result == null || result.isEmpty()) {
                throw new RuntimeException("Yahoo Finance: résultat vide pour " + symbol);
            }

            Map<String, Object> firstResult = (Map<String, Object>) result.get(0);
            Map<String, Object> meta = (Map<String, Object>) firstResult.get("meta");
            
            if (meta == null) {
                throw new RuntimeException("Yahoo Finance: meta absent pour " + symbol);
            }

            Object regularMarketPrice = meta.get("regularMarketPrice");
            if (regularMarketPrice == null) {
                throw new RuntimeException("Yahoo Finance: regularMarketPrice absent pour " + symbol);
            }

            BigDecimal price = new BigDecimal(regularMarketPrice.toString());
            if (price.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Yahoo Finance: prix invalide (" + price + ") pour " + symbol);
            }

            logger.debug("Prix Yahoo Finance pour {}: {}", symbol, price);
            return price;
        } catch (Exception e) {
            logger.error("Yahoo Finance: erreur pour {}: {}", symbol, e.getMessage());
            throw new RuntimeException("Yahoo Finance: impossible de récupérer le prix pour le symbole: " + symbol + " - " + e.getMessage());
        }
    }
}
