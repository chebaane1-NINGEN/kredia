package com.kredia.repository;

import com.kredia.entity.investment.InvestmentStrategy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentStrategyRepository extends JpaRepository<InvestmentStrategy, Long> {

    @Query("SELECT s FROM InvestmentStrategy s WHERE s.user.id = :userId")
    List<InvestmentStrategy> findByUserUserId(@Param("userId") Long userId);

    List<InvestmentStrategy> findByIsActive(Boolean isActive);

    @Query("SELECT s FROM InvestmentStrategy s WHERE s.user.id = :userId AND s.isActive = :isActive")
    List<InvestmentStrategy> findByUserUserIdAndIsActive(@Param("userId") Long userId, @Param("isActive") Boolean isActive);
}
