package com.kredia.repository;

import com.kredia.entity.investment.PortfolioPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioPositionRepository extends JpaRepository<PortfolioPosition, Long> {

    @Query("SELECT p FROM PortfolioPosition p WHERE p.user.id = :userId")
    List<PortfolioPosition> findByUserUserId(@Param("userId") Long userId);

    List<PortfolioPosition> findByAssetSymbol(String assetSymbol);

    @Query("SELECT p FROM PortfolioPosition p WHERE p.user.id = :userId AND p.assetSymbol = :assetSymbol")
    Optional<PortfolioPosition> findByUserUserIdAndAssetSymbol(@Param("userId") Long userId, @Param("assetSymbol") String assetSymbol);
}
