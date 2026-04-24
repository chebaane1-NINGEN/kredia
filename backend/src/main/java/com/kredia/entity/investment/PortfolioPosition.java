package com.kredia.entity.investment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.kredia.entity.user.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "portfolio_positions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PortfolioPosition {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "position_id")
    private Long positionId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "asset_symbol", nullable = false)
    private String assetSymbol;
    
    @Column(name = "current_quantity", nullable = false, precision = 15, scale = 8)
    private BigDecimal currentQuantity;
    
    @Column(name = "avg_purchase_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal avgPurchasePrice;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public PortfolioPosition() {
    }

    public PortfolioPosition(Long positionId, User user, String assetSymbol, BigDecimal currentQuantity, BigDecimal avgPurchasePrice, LocalDateTime createdAt) {
        this.positionId = positionId;
        this.user = user;
        this.assetSymbol = assetSymbol;
        this.currentQuantity = currentQuantity;
        this.avgPurchasePrice = avgPurchasePrice;
        this.createdAt = createdAt;
    }

    public PortfolioPosition(User user, String assetSymbol, BigDecimal currentQuantity, BigDecimal avgPurchasePrice, LocalDateTime createdAt) {
        this.user = user;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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
