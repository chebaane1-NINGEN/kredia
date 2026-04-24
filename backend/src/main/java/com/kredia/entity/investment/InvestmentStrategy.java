package com.kredia.entity.investment;

import com.kredia.entity.user.User;
import com.kredia.enums.StrategyRiskProfile;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "investment_strategies")
public class InvestmentStrategy {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "strategy_id")
    private Long strategyId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "strategy_name", nullable = false, length = 200)
    private String strategyName;
    
    @Column(name = "max_budget", precision = 15, scale = 2)
    private BigDecimal maxBudget;
    
    @Column(name = "stop_loss_pct", precision = 5, scale = 2)
    private BigDecimal stopLossPct;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_profile", nullable = false, length = 20)
    private StrategyRiskProfile riskProfile = StrategyRiskProfile.MEDIUM;

    @Column(name = "auto_create_orders", nullable = false)
    private Boolean autoCreateOrders = true;

    @Column(name = "auto_create_positions", nullable = false)
    private Boolean autoCreatePositions = false;

    @Column(name = "max_assets", nullable = false)
    private Integer maxAssets = 5;
    
    @Column(name = "reinvest_profits", nullable = false)
    private Boolean reinvestProfits = false;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getStrategyId() {
        return strategyId;
    }

    public void setStrategyId(Long strategyId) {
        this.strategyId = strategyId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getStrategyName() {
        return strategyName;
    }

    public void setStrategyName(String strategyName) {
        this.strategyName = strategyName;
    }

    public BigDecimal getMaxBudget() {
        return maxBudget;
    }

    public void setMaxBudget(BigDecimal maxBudget) {
        this.maxBudget = maxBudget;
    }

    public BigDecimal getStopLossPct() {
        return stopLossPct;
    }

    public void setStopLossPct(BigDecimal stopLossPct) {
        this.stopLossPct = stopLossPct;
    }

    public StrategyRiskProfile getRiskProfile() {
        return riskProfile;
    }

    public void setRiskProfile(StrategyRiskProfile riskProfile) {
        this.riskProfile = riskProfile;
    }

    public Boolean getAutoCreateOrders() {
        return autoCreateOrders;
    }

    public void setAutoCreateOrders(Boolean autoCreateOrders) {
        this.autoCreateOrders = autoCreateOrders;
    }

    public Boolean getAutoCreatePositions() {
        return autoCreatePositions;
    }

    public void setAutoCreatePositions(Boolean autoCreatePositions) {
        this.autoCreatePositions = autoCreatePositions;
    }

    public Integer getMaxAssets() {
        return maxAssets;
    }

    public void setMaxAssets(Integer maxAssets) {
        this.maxAssets = maxAssets;
    }

    public Boolean getReinvestProfits() {
        return reinvestProfits;
    }

    public void setReinvestProfits(Boolean reinvestProfits) {
        this.reinvestProfits = reinvestProfits;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
