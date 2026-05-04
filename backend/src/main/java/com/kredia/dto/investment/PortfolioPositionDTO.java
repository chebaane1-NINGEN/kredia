package com.kredia.dto.investment;

import java.math.BigDecimal;

/**
 * DTO pour la création d'une position de portefeuille.
 * Le prix d'achat est automatiquement récupéré depuis l'API de marché (Binance / Alpha Vantage).
 */
public class PortfolioPositionDTO {
    private Long userId;
    private String assetSymbol;
    private BigDecimal quantity;

    public PortfolioPositionDTO() {}

    public PortfolioPositionDTO(Long userId, String assetSymbol, BigDecimal quantity) {
        this.userId = userId;
        this.assetSymbol = assetSymbol;
        this.quantity = quantity;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getAssetSymbol() {
        return assetSymbol;
    }

    public void setAssetSymbol(String assetSymbol) {
        this.assetSymbol = assetSymbol;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
}
