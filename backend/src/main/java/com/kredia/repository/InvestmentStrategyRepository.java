package com.kredia.repository;

import com.kredia.entity.investment.InvestmentStrategy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentStrategyRepository extends JpaRepository<InvestmentStrategy, Long> {
    List<InvestmentStrategy> findByUserUserId(Long userId);
    List<InvestmentStrategy> findByIsActive(Boolean isActive);
    List<InvestmentStrategy> findByUserUserIdAndIsActive(Long userId, Boolean isActive);
}
