package com.kredia.dto.investment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StrategyCreatedPositionDTO {
    private Long positionId;
    private String assetSymbol;
    private BigDecimal currentQuantity;
    private BigDecimal avgPurchasePrice;
    private LocalDateTime createdAt;
}
