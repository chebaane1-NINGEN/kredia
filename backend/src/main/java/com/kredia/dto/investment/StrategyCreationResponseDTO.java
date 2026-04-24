package com.kredia.dto.investment;

import com.kredia.entity.investment.InvestmentStrategy;

import java.util.List;

public class StrategyCreationResponseDTO {
    private InvestmentStrategy strategy;
    private List<StrategyCreatedPositionDTO> createdPositions;
    private String message;

    public StrategyCreationResponseDTO() {
    }

    public StrategyCreationResponseDTO(InvestmentStrategy strategy, List<StrategyCreatedPositionDTO> createdPositions, String message) {
        this.strategy = strategy;
        this.createdPositions = createdPositions;
        this.message = message;
    }

    // Getters and Setters
    public InvestmentStrategy getStrategy() {
        return strategy;
    }

    public void setStrategy(InvestmentStrategy strategy) {
        this.strategy = strategy;
    }

    public List<StrategyCreatedPositionDTO> getCreatedPositions() {
        return createdPositions;
    }

    public void setCreatedPositions(List<StrategyCreatedPositionDTO> createdPositions) {
        this.createdPositions = createdPositions;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
