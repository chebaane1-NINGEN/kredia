package com.kredia.service;

import com.kredia.entity.investment.*;
import com.kredia.entity.user.User;
import com.kredia.enums.AssetCategory;
import com.kredia.enums.OrderStatus;
import com.kredia.enums.RiskLevel;
import com.kredia.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class InvestmentService {

    private final InvestmentAssetRepository assetRepository;
    private final InvestmentOrderRepository orderRepository;
    private final InvestmentStrategyRepository strategyRepository;
    private final PortfolioPositionRepository positionRepository;
    private final UserRepository userRepository;

    @Autowired
    public InvestmentService(
            InvestmentAssetRepository assetRepository,
            InvestmentOrderRepository orderRepository,
            InvestmentStrategyRepository strategyRepository,
            PortfolioPositionRepository positionRepository,
            UserRepository userRepository) {
        this.assetRepository = assetRepository;
        this.orderRepository = orderRepository;
        this.strategyRepository = strategyRepository;
        this.positionRepository = positionRepository;
        this.userRepository = userRepository;
    }

    // ==================== InvestmentAsset CRUD ====================
    
    public InvestmentAsset createAsset(InvestmentAsset asset) {
        return assetRepository.save(asset);
    }

    public Optional<InvestmentAsset> getAssetById(Long id) {
        return assetRepository.findById(id);
    }

    public List<InvestmentAsset> getAllAssets() {
        return assetRepository.findAll();
    }

    public InvestmentAsset updateAsset(Long id, InvestmentAsset assetDetails) {
        InvestmentAsset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found with id " + id));
        
        asset.setSymbol(assetDetails.getSymbol());
        asset.setAssetName(assetDetails.getAssetName());
        asset.setCategory(assetDetails.getCategory());
        asset.setRiskLevel(assetDetails.getRiskLevel());
        
        return assetRepository.save(asset);
    }

    public void deleteAsset(Long id) {
        if (!assetRepository.existsById(id)) {
            throw new RuntimeException("Asset not found with id " + id);
        }
        assetRepository.deleteById(id);
    }

    public Optional<InvestmentAsset> getAssetBySymbol(String symbol) {
        return assetRepository.findBySymbol(symbol);
    }

    public List<InvestmentAsset> getAssetsByCategory(AssetCategory category) {
        return assetRepository.findByCategory(category);
    }

    public List<InvestmentAsset> getAssetsByRiskLevel(RiskLevel riskLevel) {
        return assetRepository.findByRiskLevel(riskLevel);
    }

    // ==================== InvestmentOrder CRUD ====================
    
    public InvestmentOrder createOrder(InvestmentOrder order) {
        // Validate and fetch full User entity
        Long userId = order.getUser().getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
        order.setUser(user);

        return orderRepository.save(order);
    }

    public Optional<InvestmentOrder> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public List<InvestmentOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    public InvestmentOrder updateOrder(Long id, InvestmentOrder orderDetails) {
        InvestmentOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id " + id));
        
        if (orderDetails.getUser() != null && orderDetails.getUser().getUserId() != null) {
            User user = userRepository.findById(orderDetails.getUser().getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            order.setUser(user);
        }
        
        if (orderDetails.getAsset() != null && orderDetails.getAsset().getAssetId() != null) {
            InvestmentAsset asset = assetRepository.findById(orderDetails.getAsset().getAssetId())
                    .orElseThrow(() -> new RuntimeException("Asset not found"));
            order.setAsset(asset);
        }
        
        order.setOrderType(orderDetails.getOrderType());
        order.setQuantity(orderDetails.getQuantity());
        order.setPrice(orderDetails.getPrice());
        order.setOrderStatus(orderDetails.getOrderStatus());
        order.setExecutedAt(orderDetails.getExecutedAt());
        
        return orderRepository.save(order);
    }

    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new RuntimeException("Order not found with id " + id);
        }
        orderRepository.deleteById(id);
    }

    public List<InvestmentOrder> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserUserId(userId);
    }

    public List<InvestmentOrder> getOrdersByAssetId(Long assetId) {
        return orderRepository.findByAssetAssetId(assetId);
    }

    public List<InvestmentOrder> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByOrderStatus(status);
    }

    public List<InvestmentOrder> getOrdersByUserIdAndStatus(Long userId, OrderStatus status) {
        return orderRepository.findByUserUserIdAndOrderStatus(userId, status);
    }

    // ==================== InvestmentStrategy CRUD ====================
    
    public InvestmentStrategy createStrategy(InvestmentStrategy strategy) {
        // Validate and fetch full User entity
        Long userId = strategy.getUser().getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
        strategy.setUser(user);

        return strategyRepository.save(strategy);
    }

    public Optional<InvestmentStrategy> getStrategyById(Long id) {
        return strategyRepository.findById(id);
    }

    public List<InvestmentStrategy> getAllStrategies() {
        return strategyRepository.findAll();
    }

    public InvestmentStrategy updateStrategy(Long id, InvestmentStrategy strategyDetails) {
        InvestmentStrategy strategy = strategyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Strategy not found with id " + id));
        
        if (strategyDetails.getUser() != null && strategyDetails.getUser().getUserId() != null) {
            User user = userRepository.findById(strategyDetails.getUser().getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            strategy.setUser(user);
        }
        
        strategy.setStrategyName(strategyDetails.getStrategyName());
        strategy.setMaxBudget(strategyDetails.getMaxBudget());
        strategy.setStopLossPct(strategyDetails.getStopLossPct());
        strategy.setReinvestProfits(strategyDetails.getReinvestProfits());
        strategy.setIsActive(strategyDetails.getIsActive());
        
        return strategyRepository.save(strategy);
    }

    public void deleteStrategy(Long id) {
        if (!strategyRepository.existsById(id)) {
            throw new RuntimeException("Strategy not found with id " + id);
        }
        strategyRepository.deleteById(id);
    }

    public List<InvestmentStrategy> getStrategiesByUserId(Long userId) {
        return strategyRepository.findByUserUserId(userId);
    }

    public List<InvestmentStrategy> getStrategiesByActiveStatus(Boolean isActive) {
        return strategyRepository.findByIsActive(isActive);
    }

    public List<InvestmentStrategy> getStrategiesByUserIdAndActiveStatus(Long userId, Boolean isActive) {
        return strategyRepository.findByUserUserIdAndIsActive(userId, isActive);
    }

    // ==================== PortfolioPosition CRUD ====================
    
    public PortfolioPosition createPosition(PortfolioPosition position) {
        // Validate and fetch full User entity
        Long userId = position.getUser().getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
        position.setUser(user);

        // Validate and fetch full Asset entity
        Long assetId = position.getAsset().getAssetId();
        InvestmentAsset asset = assetRepository.findById(assetId)
                .orElseThrow(() -> new RuntimeException("Asset not found with id " + assetId));
        position.setAsset(asset);

        return positionRepository.save(position);
    }

    public Optional<PortfolioPosition> getPositionById(Long id) {
        return positionRepository.findById(id);
    }

    public List<PortfolioPosition> getAllPositions() {
        return positionRepository.findAll();
    }

    public PortfolioPosition updatePosition(Long id, PortfolioPosition positionDetails) {
        PortfolioPosition position = positionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Position not found with id " + id));
        
        if (positionDetails.getUser() != null && positionDetails.getUser().getUserId() != null) {
            User user = userRepository.findById(positionDetails.getUser().getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            position.setUser(user);
        }
        
        if (positionDetails.getAsset() != null && positionDetails.getAsset().getAssetId() != null) {
            InvestmentAsset asset = assetRepository.findById(positionDetails.getAsset().getAssetId())
                    .orElseThrow(() -> new RuntimeException("Asset not found"));
            position.setAsset(asset);
        }
        
        position.setCurrentQuantity(positionDetails.getCurrentQuantity());
        position.setAvgPurchasePrice(positionDetails.getAvgPurchasePrice());
        
        return positionRepository.save(position);
    }

    public void deletePosition(Long id) {
        if (!positionRepository.existsById(id)) {
            throw new RuntimeException("Position not found with id " + id);
        }
        positionRepository.deleteById(id);
    }

    public List<PortfolioPosition> getPositionsByUserId(Long userId) {
        return positionRepository.findByUserUserId(userId);
    }

    public List<PortfolioPosition> getPositionsByAssetId(Long assetId) {
        return positionRepository.findByAssetAssetId(assetId);
    }

    public Optional<PortfolioPosition> getPositionByUserIdAndAssetId(Long userId, Long assetId) {
        return positionRepository.findByUserUserIdAndAssetAssetId(userId, assetId);
    }
}
