package com.kredia.repository;

import com.kredia.entity.investment.InvestmentOrder;
import com.kredia.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentOrderRepository extends JpaRepository<InvestmentOrder, Long> {

    @Query("SELECT o FROM InvestmentOrder o WHERE o.user.id = :userId")
    List<InvestmentOrder> findByUserUserId(@Param("userId") Long userId);

    List<InvestmentOrder> findByAssetSymbol(String assetSymbol);

    List<InvestmentOrder> findByOrderStatus(OrderStatus orderStatus);

    @Query("SELECT o FROM InvestmentOrder o WHERE o.user.id = :userId AND o.orderStatus = :orderStatus")
    List<InvestmentOrder> findByUserUserIdAndOrderStatus(@Param("userId") Long userId, @Param("orderStatus") OrderStatus orderStatus);
}
