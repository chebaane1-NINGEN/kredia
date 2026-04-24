package com.kredia.dto.investment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StrategyCreatedPositionDTO {
    private Long positionId;
    private String assetSymbol;
    private BigDecimal currentQuantity;
    private BigDecimal avgPurchasePrice;
    private LocalDateTime createdAt;

    public StrategyCreatedPositionDTO() {
    }

    public StrategyCreatedPositionDTO(Long positionId, String assetSymbol, BigDecimal currentQuantity, BigDecimal avgPurchasePrice, LocalDateTime createdAt) {
        this.positionId = positionId;
        this.assetSymbol = assetSymbol;
        this.currentQuantity = currentQuantity;
        this.avgPurchasePrice = avgPurchasePrice;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getPositionId() {
        return positionId;
    }

    public void setPositionId(Long positionId) {
        this.positionId = positionId;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
