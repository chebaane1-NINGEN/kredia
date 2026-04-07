package com.kredia.dto.investment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO de réponse pour les positions de portefeuille avec calculs de profit.
 */
public class PortfolioPositionResponseDTO {
    private Long positionId;
    private Long userId;
    private String assetSymbol;
    private BigDecimal currentQuantity;
    private BigDecimal avgPurchasePrice;
    private BigDecimal currentMarketPrice;
    private BigDecimal currentValue;
    private BigDecimal profitLossDollars;
    private BigDecimal profitLossPercentage;
    private LocalDateTime createdAt;

    public PortfolioPositionResponseDTO() {}

    public PortfolioPositionResponseDTO(Long positionId, Long userId, String assetSymbol, 
                                         BigDecimal currentQuantity, BigDecimal avgPurchasePrice,
                                         BigDecimal currentMarketPrice, BigDecimal currentValue,
                                         BigDecimal profitLossDollars, BigDecimal profitLossPercentage,
                                         LocalDateTime createdAt) {
        this.positionId = positionId;
        this.userId = userId;
        this.assetSymbol = assetSymbol;
        this.currentQuantity = currentQuantity;
        this.avgPurchasePrice = avgPurchasePrice;
        this.currentMarketPrice = currentMarketPrice;
        this.currentValue = currentValue;
        this.profitLossDollars = profitLossDollars;
        this.profitLossPercentage = profitLossPercentage;
        this.createdAt = createdAt;
    }

    // Getters and Setters

    public Long getPositionId() {
        return positionId;
    }

    public void setPositionId(Long positionId) {
        this.positionId = positionId;
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

    public BigDecimal getCurrentQuantity() {
        return currentQuantity;
    }

    public void setCurrentQuantity(BigDecimal currentQuantity) {
        this.currentQuantity = currentQuantity;
    }

    public BigDecimal getAvgPurchasePrice() {
        return avgPurchasePrice;
    }

    public void setAvgPurchasePrice(BigDecimal avgPurchasePrice) {
        this.avgPurchasePrice = avgPurchasePrice;
    }

    public BigDecimal getCurrentMarketPrice() {
        return currentMarketPrice;
    }

    public void setCurrentMarketPrice(BigDecimal currentMarketPrice) {
        this.currentMarketPrice = currentMarketPrice;
    }

    public BigDecimal getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(BigDecimal currentValue) {
        this.currentValue = currentValue;
    }

    public BigDecimal getProfitLossDollars() {
        return profitLossDollars;
    }

    public void setProfitLossDollars(BigDecimal profitLossDollars) {
        this.profitLossDollars = profitLossDollars;
    }

    public BigDecimal getProfitLossPercentage() {
        return profitLossPercentage;
    }

    public void setProfitLossPercentage(BigDecimal profitLossPercentage) {
        this.profitLossPercentage = profitLossPercentage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
