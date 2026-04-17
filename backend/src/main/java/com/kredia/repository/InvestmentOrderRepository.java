package com.kredia.repository;

import com.kredia.entity.investment.InvestmentOrder;
import com.kredia.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentOrderRepository extends JpaRepository<InvestmentOrder, Long> {
    List<InvestmentOrder> findByUser_Id(Long userId);
    List<InvestmentOrder> findByAssetSymbol(String assetSymbol);
    List<InvestmentOrder> findByOrderStatus(OrderStatus orderStatus);
    List<InvestmentOrder> findByUser_IdAndOrderStatus(Long userId, OrderStatus orderStatus);
}
