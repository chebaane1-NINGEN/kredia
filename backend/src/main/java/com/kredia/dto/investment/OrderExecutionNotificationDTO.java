package com.kredia.dto.investment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderExecutionNotificationDTO {
    private Long orderId;
    private Long userId;
    private String assetSymbol;
    private String orderType;
    private BigDecimal quantity;
    private BigDecimal executedPrice;
    private String executedAt;
}
