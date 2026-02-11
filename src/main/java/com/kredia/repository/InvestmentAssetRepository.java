package com.kredia.repository;

import com.kredia.entity.investment.InvestmentAsset;
import com.kredia.enums.AssetCategory;
import com.kredia.enums.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestmentAssetRepository extends JpaRepository<InvestmentAsset, Long> {
    Optional<InvestmentAsset> findBySymbol(String symbol);
    List<InvestmentAsset> findByCategory(AssetCategory category);
    List<InvestmentAsset> findByRiskLevel(RiskLevel riskLevel);
}
