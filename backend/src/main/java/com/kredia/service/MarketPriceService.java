package com.kredia.service;

import com.kredia.entity.investment.InvestmentAsset;
import com.kredia.enums.AssetCategory;
import com.kredia.repository.InvestmentAssetRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@Service
public class MarketPriceService {

    private final RestTemplate restTemplate;
    private final InvestmentAssetRepository assetRepository;

    @Value("${market.alphavantage.api-key:}")
    private String alphaVantageApiKey;

    public MarketPriceService(RestTemplate restTemplate, InvestmentAssetRepository assetRepository) {
        this.restTemplate = restTemplate;
        this.assetRepository = assetRepository;
    }

    /**
     * Fetches the current market price for the given asset symbol.
     * - CRYPTO  → Binance API (no API key required)
     * - STOCK / ETF → Alpha Vantage API (requires 'market.alphavantage.api-key' in application.properties)
     * - BOND / COMMODITY → Alpha Vantage fallback
     */
    public BigDecimal getCurrentPrice(String symbol) {
        String upperSymbol = symbol.toUpperCase();

        Optional<InvestmentAsset> assetOpt = assetRepository.findBySymbol(upperSymbol);

        if (assetOpt.isPresent() && assetOpt.get().getCategory() != AssetCategory.CRYPTO) {
            // Non-crypto asset → use Alpha Vantage
            return getStockPrice(upperSymbol);
        }

        // Default: try Binance (crypto). If it fails, fallback to Alpha Vantage.
        try {
            return getCryptoPrice(upperSymbol);
        } catch (Exception e) {
            return getStockPrice(upperSymbol);
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

    // ==================== Alpha Vantage (Stocks / ETF) ====================

    @SuppressWarnings("unchecked")
    private BigDecimal getStockPrice(String symbol) {
        if (alphaVantageApiKey == null || alphaVantageApiKey.isBlank()) {
            throw new RuntimeException(
                "Clé Alpha Vantage non configurée. Ajoutez 'market.alphavantage.api-key=VOTRE_CLE' dans application.properties. " +
                "Clé gratuite disponible sur https://www.alphavantage.co/support/#api-key"
            );
        }
        String url = "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol="
                + symbol + "&apikey=" + alphaVantageApiKey;

        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response != null && response.containsKey("Global Quote")) {
            Map<String, String> quote = (Map<String, String>) response.get("Global Quote");
            String price = quote.get("05. price");
            if (price != null && !price.isBlank()) {
                return new BigDecimal(price);
            }
        }
        throw new RuntimeException("Alpha Vantage: impossible de récupérer le prix pour le symbole: " + symbol);
    }
}
