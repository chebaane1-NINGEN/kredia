package com.kredia.repository;

import com.kredia.entity.investment.InvestmentOrder;
import com.kredia.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentOrderRepository extends JpaRepository<InvestmentOrder, Long> {
    List<InvestmentOrder> findByUserUserId(Long userId);
    List<InvestmentOrder> findByAssetAssetId(Long assetId);
    List<InvestmentOrder> findByOrderStatus(OrderStatus orderStatus);
    List<InvestmentOrder> findByUserUserIdAndOrderStatus(Long userId, OrderStatus orderStatus);
}
