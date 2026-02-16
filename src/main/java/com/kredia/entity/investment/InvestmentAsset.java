package com.kredia.entity.investment;

import com.kredia.enums.AssetCategory;
import com.kredia.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "investment_assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvestmentAsset {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "asset_id")
    private Long assetId;
    
    @Column(name = "symbol", nullable = false, unique = true, length = 20)
    private String symbol;
    
    @Column(name = "asset_name", nullable = false, length = 200)
    private String assetName;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private AssetCategory category;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    private RiskLevel riskLevel;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "asset", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InvestmentOrder> orders;
    
    @OneToMany(mappedBy = "asset", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PortfolioPosition> portfolioPositions;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
