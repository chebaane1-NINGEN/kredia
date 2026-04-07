package com.kredia.service;

import com.kredia.dto.investment.PortfolioPositionDTO;
import com.kredia.dto.investment.PortfolioPositionResponseDTO;
import com.kredia.dto.investment.StrategyCreatedPositionDTO;
import com.kredia.dto.investment.StrategyCreationResponseDTO;
import com.kredia.entity.investment.*;
import com.kredia.entity.user.User;
import com.kredia.enums.AssetCategory;
import com.kredia.enums.OrderStatus;
import com.kredia.enums.OrderType;
import com.kredia.enums.RiskLevel;
import com.kredia.enums.StrategyRiskProfile;
import com.kredia.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class InvestmentService {

    private final InvestmentAssetRepository assetRepository;
    private final InvestmentOrderRepository orderRepository;
    private final InvestmentStrategyRepository strategyRepository;
    private final PortfolioPositionRepository positionRepository;
    private final UserRepository userRepository;
    private final MarketPriceService marketPriceService;
    private final YahooMarketDataService yahooMarketDataService;
    private final GeminiService geminiService;

    @Value("${investment.strategy.universe:AAPL,MSFT,GOOGL,AMZN,TSLA,NVDA,META,JNJ,JPM,V}")
    private String strategyUniverse;

    @Autowired
    public InvestmentService(
            InvestmentAssetRepository assetRepository,
            InvestmentOrderRepository orderRepository,
            InvestmentStrategyRepository strategyRepository,
            PortfolioPositionRepository positionRepository,
            UserRepository userRepository,
            MarketPriceService marketPriceService,
            YahooMarketDataService yahooMarketDataService,
            GeminiService geminiService) {
        this.assetRepository = assetRepository;
        this.orderRepository = orderRepository;
        this.strategyRepository = strategyRepository;
        this.positionRepository = positionRepository;
        this.userRepository = userRepository;
        this.marketPriceService = marketPriceService;
        this.yahooMarketDataService = yahooMarketDataService;
        this.geminiService = geminiService;
    }

    public Map<String, Object> generateStrategicMarketSummary(String language, String tone, String additionalContext) {
        return geminiService.generateStrategicMarketSummaryJson(language, tone, additionalContext);
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
        
        if (orderDetails.getAssetSymbol() != null) {
            order.setAssetSymbol(orderDetails.getAssetSymbol());
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

    public List<InvestmentOrder> getOrdersByAssetSymbol(String assetSymbol) {
        return orderRepository.findByAssetSymbol(assetSymbol);
    }

    public List<InvestmentOrder> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByOrderStatus(status);
    }

    public List<InvestmentOrder> getOrdersByUserIdAndStatus(Long userId, OrderStatus status) {
        return orderRepository.findByUserUserIdAndOrderStatus(userId, status);
    }

    // ==================== InvestmentStrategy CRUD ====================
    
        public StrategyCreationResponseDTO createStrategy(InvestmentStrategy strategy) {
        // Validate and fetch full User entity
        Long userId = strategy.getUser().getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
        strategy.setUser(user);

        InvestmentStrategy savedStrategy = strategyRepository.save(strategy);
        BootstrapExecutionResult executionResult = bootstrapStrategy(savedStrategy);
        List<PortfolioPosition> createdPositions = executionResult.createdPositions();

        List<StrategyCreatedPositionDTO> createdPositionDtos = createdPositions.stream()
            .map(position -> new StrategyCreatedPositionDTO(
                position.getPositionId(),
                position.getAssetSymbol(),
                position.getCurrentQuantity(),
                position.getAvgPurchasePrice(),
                position.getCreatedAt()
            ))
            .collect(Collectors.toList());

        String message = buildStrategyExecutionMessage(
            createdPositionDtos.size(),
            executionResult.updatedPositionsCount(),
            executionResult.createdOrdersCount(),
            executionResult.debugHints()
        );

        return new StrategyCreationResponseDTO(savedStrategy, createdPositionDtos, message);
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
        strategy.setRiskProfile(strategyDetails.getRiskProfile());
        strategy.setAutoCreateOrders(strategyDetails.getAutoCreateOrders());
        strategy.setAutoCreatePositions(strategyDetails.getAutoCreatePositions());
        strategy.setMaxAssets(strategyDetails.getMaxAssets());
        strategy.setReinvestProfits(strategyDetails.getReinvestProfits());
        strategy.setIsActive(strategyDetails.getIsActive());
        
        return strategyRepository.save(strategy);
    }

    private BootstrapExecutionResult bootstrapStrategy(InvestmentStrategy strategy) {
        List<PortfolioPosition> createdPositions = new java.util.ArrayList<>();
        List<String> debugHints = new java.util.ArrayList<>();
        int updatedPositionsCount = 0;
        int createdOrdersCount = 0;
        int skippedInvalidPrice = 0;
        int skippedInvalidQuantity = 0;
        int skippedInvalidStopLoss = 0;

        if (strategy.getIsActive() == null || !strategy.getIsActive()) {
            debugHints.add("Stratégie inactive (isActive=false).");
            return new BootstrapExecutionResult(createdPositions, updatedPositionsCount, createdOrdersCount, debugHints);
        }

        BigDecimal maxBudget = strategy.getMaxBudget();
        if (maxBudget == null || maxBudget.compareTo(BigDecimal.ZERO) <= 0) {
            debugHints.add("Budget invalide (maxBudget null ou <= 0).");
            return new BootstrapExecutionResult(createdPositions, updatedPositionsCount, createdOrdersCount, debugHints);
        }

        if (!Boolean.TRUE.equals(strategy.getAutoCreatePositions())) {
            debugHints.add("Création de positions désactivée (autoCreatePositions=false).");
        }

        if (parseUniverse(strategyUniverse).isEmpty()) {
            debugHints.add("Univers des symboles vide (investment.strategy.universe).");
            return new BootstrapExecutionResult(createdPositions, updatedPositionsCount, createdOrdersCount, debugHints);
        }

        int maxAssets = strategy.getMaxAssets() != null && strategy.getMaxAssets() > 0
                ? strategy.getMaxAssets()
                : 5;

        AssetSelectionResult selectionResult = selectAssetsByRiskAndKpi(strategy, maxAssets);
        List<YahooMarketDataService.EvaluatedAsset> selectedAssets = selectionResult.selectedAssets();
        debugHints.addAll(selectionResult.debugHints());
        if (selectedAssets.isEmpty()) {
            debugHints.add("Aucun actif Yahoo sélectionné pour le profil de risque " + strategy.getRiskProfile() + ".");
            return new BootstrapExecutionResult(createdPositions, updatedPositionsCount, createdOrdersCount, debugHints);
        }

        BigDecimal allocationPerAsset = maxBudget
                .divide(BigDecimal.valueOf(selectedAssets.size()), 8, RoundingMode.HALF_UP);

        for (YahooMarketDataService.EvaluatedAsset asset : selectedAssets) {
            BigDecimal currentPrice = asset.getCurrentPrice();
            if (currentPrice == null || currentPrice.compareTo(BigDecimal.ZERO) <= 0) {
                skippedInvalidPrice++;
                continue;
            }

            BigDecimal quantity = allocationPerAsset.divide(currentPrice, 8, RoundingMode.HALF_UP);
            if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
                skippedInvalidQuantity++;
                continue;
            }

            // KPI calculé pour la stratégie : seuil stop-loss estimé
            BigDecimal stopLossPrice = calculateStopLossPrice(currentPrice, strategy.getStopLossPct());
            if (stopLossPrice != null && stopLossPrice.compareTo(BigDecimal.ZERO) <= 0) {
                skippedInvalidStopLoss++;
                continue;
            }

            if (Boolean.TRUE.equals(strategy.getAutoCreateOrders())) {
                createAutoBuyOrder(strategy, asset.getSymbol(), quantity, currentPrice);
                createdOrdersCount++;
            }

            if (Boolean.TRUE.equals(strategy.getAutoCreatePositions())) {
                PositionMutationResult mutationResult = createOrUpdatePosition(strategy, asset.getSymbol(), quantity, currentPrice);
                if (mutationResult.created()) {
                    createdPositions.add(mutationResult.position());
                } else {
                    updatedPositionsCount++;
                }
            }
        }

        if (createdPositions.isEmpty() && updatedPositionsCount == 0) {
            if (skippedInvalidPrice > 0) {
                debugHints.add("Actifs ignorés: prix courant invalide pour " + skippedInvalidPrice + " symbole(s). ");
            }
            if (skippedInvalidQuantity > 0) {
                debugHints.add("Actifs ignorés: quantité calculée <= 0 pour " + skippedInvalidQuantity + " symbole(s). ");
            }
            if (skippedInvalidStopLoss > 0) {
                debugHints.add("Actifs ignorés: stopLossPrice <= 0 pour " + skippedInvalidStopLoss + " symbole(s). ");
            }
        }

        return new BootstrapExecutionResult(createdPositions, updatedPositionsCount, createdOrdersCount, debugHints);
    }

    private String buildStrategyExecutionMessage(int createdPositionsCount,
                                                 int updatedPositionsCount,
                                                 int createdOrdersCount,
                                                 List<String> debugHints) {
        String baseMessage;
        if (createdPositionsCount > 0) {
            baseMessage = createdPositionsCount + " position(s) créée(s) avec succès.";
        } else if (updatedPositionsCount > 0) {
            baseMessage = "Aucune nouvelle position créée. " + updatedPositionsCount + " position(s) existante(s) mise(s) à jour.";
        } else {
            baseMessage = "Aucune position créée lors de l'exécution de la stratégie.";
        }

        String orderPart = createdOrdersCount > 0
                ? " Ordres créés: " + createdOrdersCount + "."
                : "";

        String hintsPart = (debugHints == null || debugHints.isEmpty())
                ? ""
                : " Détails: " + String.join(" ", debugHints);

        return baseMessage + orderPart + hintsPart;
    }

    private AssetSelectionResult selectAssetsByRiskAndKpi(InvestmentStrategy strategy, int maxAssets) {
        List<RiskLevel> allowedRiskLevels = mapRiskProfileToRiskLevels(strategy.getRiskProfile());
        List<String> hints = new java.util.ArrayList<>();

        List<YahooMarketDataService.EvaluatedAsset> eligibleAssets = new java.util.ArrayList<>();

        for (String symbol : parseUniverse(strategyUniverse)) {
            Optional<YahooMarketDataService.EvaluatedAsset> evaluatedAssetOpt = yahooMarketDataService.evaluateAsset(symbol);

            if (evaluatedAssetOpt.isEmpty()) {
                addHintLimited(hints, "Symbole ignoré: " + symbol + " (données Yahoo indisponibles).", 15);
                continue;
            }

            YahooMarketDataService.EvaluatedAsset evaluatedAsset = evaluatedAssetOpt.get();
            if (!allowedRiskLevels.contains(evaluatedAsset.getRiskLevel())) {
                addHintLimited(
                        hints,
                        "Symbole ignoré: " + symbol + " (riskLevel=" + evaluatedAsset.getRiskLevel() + ", attendu=" + allowedRiskLevels + ").",
                        15
                );
                continue;
            }

            eligibleAssets.add(evaluatedAsset);
        }

        List<YahooMarketDataService.EvaluatedAsset> selected = eligibleAssets.stream()
                .map(asset -> Map.entry(asset, calculateAssetScore(strategy, asset)))
                .sorted(Map.Entry.<YahooMarketDataService.EvaluatedAsset, BigDecimal>comparingByValue(Comparator.reverseOrder()))
                .limit(maxAssets)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        if (!selected.isEmpty()) {
            addHintLimited(hints, "Actifs sélectionnés: " + selected.stream().map(YahooMarketDataService.EvaluatedAsset::getSymbol).collect(Collectors.joining(", ")) + ".", 16);
        }

        return new AssetSelectionResult(selected, hints);
    }

    private void addHintLimited(List<String> hints, String hint, int maxHints) {
        if (hints.size() < maxHints) {
            hints.add(hint);
        }
    }

    private BigDecimal calculateAssetScore(InvestmentStrategy strategy, YahooMarketDataService.EvaluatedAsset asset) {
        BigDecimal riskFit = switch (asset.getRiskLevel()) {
            case LOW -> new BigDecimal("1.00");
            case MEDIUM -> new BigDecimal("0.85");
            case HIGH -> new BigDecimal("0.70");
            case VERY_HIGH -> new BigDecimal("0.55");
        };

        BigDecimal profileWeight = switch (strategy.getRiskProfile() != null ? strategy.getRiskProfile() : StrategyRiskProfile.MEDIUM) {
            case LOW -> new BigDecimal("1.10");
            case MEDIUM -> new BigDecimal("1.00");
            case HIGH -> new BigDecimal("0.90");
        };

        BigDecimal momentum20Score = normalizeBounded(asset.getMomentum20d(), new BigDecimal("-0.20"), new BigDecimal("0.20"));
        BigDecimal momentum60Score = normalizeBounded(asset.getMomentum60d(), new BigDecimal("-0.30"), new BigDecimal("0.30"));

        BigDecimal volatilityScore = BigDecimal.ONE.subtract(
                normalizeBounded(asset.getVolatilityAnn(), BigDecimal.ZERO, new BigDecimal("0.60"))
        );

        BigDecimal drawdownScore = BigDecimal.ONE.subtract(
                normalizeBounded(asset.getMaxDrawdown(), BigDecimal.ZERO, new BigDecimal("0.50"))
        );

        BigDecimal liquidityScore = normalizeBounded(asset.getAvgVolume20d(), BigDecimal.ZERO, new BigDecimal("10000000"));

        BigDecimal weightedScore = riskFit.multiply(profileWeight).multiply(new BigDecimal("0.40"))
                .add(momentum20Score.multiply(new BigDecimal("0.20")))
                .add(momentum60Score.multiply(new BigDecimal("0.15")))
                .add(volatilityScore.multiply(new BigDecimal("0.15")))
                .add(drawdownScore.multiply(new BigDecimal("0.07")))
                .add(liquidityScore.multiply(new BigDecimal("0.03")));

        return weightedScore.setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizeBounded(BigDecimal value, BigDecimal min, BigDecimal max) {
        if (value == null || min == null || max == null || max.compareTo(min) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal clipped = value.max(min).min(max);
        return clipped.subtract(min)
                .divide(max.subtract(min), 8, RoundingMode.HALF_UP);
    }

    private List<String> parseUniverse(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }

        return List.of(csv.split(",")).stream()
                .map(String::trim)
                .filter(symbol -> !symbol.isBlank())
                .map(String::toUpperCase)
                .distinct()
                .collect(Collectors.toList());
    }

    private List<RiskLevel> mapRiskProfileToRiskLevels(StrategyRiskProfile profile) {
        StrategyRiskProfile resolvedProfile = profile != null ? profile : StrategyRiskProfile.MEDIUM;

        return switch (resolvedProfile) {
            case LOW -> List.of(RiskLevel.LOW);
            case MEDIUM -> List.of(RiskLevel.LOW, RiskLevel.MEDIUM);
            case HIGH -> List.of(RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.VERY_HIGH);
        };
    }

    private BigDecimal calculateStopLossPrice(BigDecimal currentPrice, BigDecimal stopLossPct) {
        if (currentPrice == null || stopLossPct == null) {
            return null;
        }

        BigDecimal ratio = stopLossPct.divide(new BigDecimal("100"), 8, RoundingMode.HALF_UP);
        BigDecimal multiplier = BigDecimal.ONE.subtract(ratio);
        return currentPrice.multiply(multiplier).setScale(8, RoundingMode.HALF_UP);
    }

    private void createAutoBuyOrder(InvestmentStrategy strategy, String symbol, BigDecimal quantity, BigDecimal currentPrice) {
        InvestmentOrder order = new InvestmentOrder();
        order.setUser(strategy.getUser());
        order.setAssetSymbol(symbol);
        order.setOrderType(OrderType.BUY);
        order.setQuantity(quantity);
        order.setPrice(currentPrice);
        order.setOrderStatus(OrderStatus.PENDING);
        orderRepository.save(order);
    }

    private PositionMutationResult createOrUpdatePosition(InvestmentStrategy strategy, String symbol, BigDecimal quantity, BigDecimal currentPrice) {
        Optional<PortfolioPosition> existingPosition = positionRepository
                .findByUserUserIdAndAssetSymbol(strategy.getUser().getUserId(), symbol);

        if (existingPosition.isPresent()) {
            PortfolioPosition position = existingPosition.get();
            BigDecimal oldQuantity = position.getCurrentQuantity();
            BigDecimal newQuantity = oldQuantity.add(quantity);

            BigDecimal weightedOldValue = oldQuantity.multiply(position.getAvgPurchasePrice());
            BigDecimal weightedNewValue = quantity.multiply(currentPrice);
            BigDecimal newAveragePrice = weightedOldValue.add(weightedNewValue)
                    .divide(newQuantity, 8, RoundingMode.HALF_UP);

            position.setCurrentQuantity(newQuantity);
            position.setAvgPurchasePrice(newAveragePrice);
            PortfolioPosition updatedPosition = positionRepository.save(position);
            return new PositionMutationResult(updatedPosition, false);
        }

        PortfolioPosition newPosition = new PortfolioPosition();
        newPosition.setUser(strategy.getUser());
        newPosition.setAssetSymbol(symbol);
        newPosition.setCurrentQuantity(quantity);
        newPosition.setAvgPurchasePrice(currentPrice);
        PortfolioPosition savedPosition = positionRepository.save(newPosition);
        return new PositionMutationResult(savedPosition, true);
    }

    private record PositionMutationResult(PortfolioPosition position, boolean created) {
    }

        private record BootstrapExecutionResult(
            List<PortfolioPosition> createdPositions,
            int updatedPositionsCount,
            int createdOrdersCount,
            List<String> debugHints
        ) {
        }

            private record AssetSelectionResult(
                List<YahooMarketDataService.EvaluatedAsset> selectedAssets,
                List<String> debugHints
            ) {
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
    
    public PortfolioPosition createPositionFromDTO(PortfolioPositionDTO positionDTO) {
        // Fetch and validate User
        User user = userRepository.findById(positionDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id " + positionDTO.getUserId()));

        // Fetch the current market price automatically from external API (Binance / Alpha Vantage)
        BigDecimal currentMarketPrice = marketPriceService.getCurrentPrice(positionDTO.getAssetSymbol());

        // Create new PortfolioPosition using the fetched market price as avg purchase price
        PortfolioPosition position = new PortfolioPosition(
            null, // positionId will be generated
            user,
            positionDTO.getAssetSymbol(),
            positionDTO.getQuantity(),
            currentMarketPrice,
            LocalDateTime.now()
        );

        return positionRepository.save(position);
    }
    
    public PortfolioPosition createPosition(PortfolioPosition position) {
        // Validate and fetch full User entity
        Long userId = position.getUser().getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
        position.setUser(user);

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
        
        if (positionDetails.getAssetSymbol() != null) {
            position.setAssetSymbol(positionDetails.getAssetSymbol());
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
        // Note: assetId parameter is kept for API compatibility
        // but we can't filter by assetId anymore since PortfolioPosition uses assetSymbol
        return positionRepository.findAll();
    }

    public Optional<PortfolioPosition> getPositionByUserIdAndAssetSymbol(Long userId, String assetSymbol) {
        return positionRepository.findByUserUserIdAndAssetSymbol(userId, assetSymbol);
    }

    // ==================== Portfolio Value Calculation ====================
    
    /**
     * Convertit une PortfolioPosition en PortfolioPositionResponseDTO avec calculs de profit.
     */
    private PortfolioPositionResponseDTO convertToResponseDTO(PortfolioPosition position) {
        try {
            // Récupérer le prix actuel du marché
            BigDecimal currentMarketPrice = marketPriceService.getCurrentPrice(position.getAssetSymbol());
            
            // Calculer la valeur actuelle: quantité * prix actuel
            BigDecimal currentValue = position.getCurrentQuantity().multiply(currentMarketPrice);
            
            // Calculer la valeur d'achat initiale: quantité * prix d'achat moyen
            BigDecimal purchaseValue = position.getCurrentQuantity().multiply(position.getAvgPurchasePrice());
            
            // Calculer le profit/perte en dollars: valeur actuelle - valeur d'achat
            BigDecimal profitLossDollars = currentValue.subtract(purchaseValue);
            
            // Calculer le profit/perte en pourcentage: ((prix actuel - prix achat) / prix achat) * 100
            BigDecimal profitLossPercentage = BigDecimal.ZERO;
            if (position.getAvgPurchasePrice().compareTo(BigDecimal.ZERO) > 0) {
                profitLossPercentage = currentMarketPrice.subtract(position.getAvgPurchasePrice())
                        .divide(position.getAvgPurchasePrice(), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));
            }
            
            return new PortfolioPositionResponseDTO(
                    position.getPositionId(),
                    position.getUser().getUserId(),
                    position.getAssetSymbol(),
                    position.getCurrentQuantity(),
                    position.getAvgPurchasePrice(),
                    currentMarketPrice,
                    currentValue,
                    profitLossDollars,
                    profitLossPercentage,
                    position.getCreatedAt()
            );
        } catch (Exception e) {
            System.err.println("Erreur lors de la conversion de la position " + position.getPositionId() + ": " + e.getMessage());
            // En cas d'erreur, retourner un DTO avec des valeurs null pour les calculs
            return new PortfolioPositionResponseDTO(
                    position.getPositionId(),
                    position.getUser().getUserId(),
                    position.getAssetSymbol(),
                    position.getCurrentQuantity(),
                    position.getAvgPurchasePrice(),
                    null,
                    null,
                    null,
                    null,
                    position.getCreatedAt()
            );
        }
    }

    /**
     * Récupère une position enrichie avec les calculs de profit.
     */
    public Optional<PortfolioPositionResponseDTO> getPositionWithProfitById(Long id) {
        return positionRepository.findById(id)
                .map(this::convertToResponseDTO);
    }

    /**
     * Récupère toutes les positions d'un utilisateur enrichies avec les calculs de profit.
     */
    public List<PortfolioPositionResponseDTO> getPositionsWithProfitByUserId(Long userId) {
        List<PortfolioPosition> positions = positionRepository.findByUserUserId(userId);
        return positions.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupère toutes les positions enrichies avec les calculs de profit.
     */
    public List<PortfolioPositionResponseDTO> getAllPositionsWithProfit() {
        List<PortfolioPosition> positions = positionRepository.findAll();
        return positions.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupère une position spécifique d'un utilisateur enrichie avec les calculs de profit.
     */
    public Optional<PortfolioPositionResponseDTO> getPositionWithProfitByUserIdAndAssetSymbol(Long userId, String assetSymbol) {
        return positionRepository.findByUserUserIdAndAssetSymbol(userId, assetSymbol)
                .map(this::convertToResponseDTO);
    }
}
