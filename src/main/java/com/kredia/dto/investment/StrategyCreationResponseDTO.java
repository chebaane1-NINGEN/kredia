package com.kredia.dto.investment;

import com.kredia.entity.investment.InvestmentStrategy;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StrategyCreationResponseDTO {
    private InvestmentStrategy strategy;
    private List<StrategyCreatedPositionDTO> createdPositions;
    private String message;
}
