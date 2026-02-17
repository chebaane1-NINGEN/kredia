package com.kredia.repository;

import com.kredia.entity.investment.PortfolioPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioPositionRepository extends JpaRepository<PortfolioPosition, Long> {
    List<PortfolioPosition> findByUserUserId(Long userId);
    List<PortfolioPosition> findByAssetAssetId(Long assetId);
    Optional<PortfolioPosition> findByUserUserIdAndAssetAssetId(Long userId, Long assetId);
}
