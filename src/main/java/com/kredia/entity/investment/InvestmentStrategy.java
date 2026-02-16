package com.kredia.entity.investment;

import com.kredia.user.entity.User;
import com.kredia.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "investment_strategies")
@Data
@NoArgsConstructor
@AllArgsConstructor
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
}
