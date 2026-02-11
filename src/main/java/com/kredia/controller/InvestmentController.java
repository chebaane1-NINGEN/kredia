package com.kredia.controller;

import com.kredia.entity.investment.*;
import com.kredia.enums.AssetCategory;
import com.kredia.enums.OrderStatus;
import com.kredia.enums.RiskLevel;
import com.kredia.service.InvestmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investments")
public class InvestmentController {

    private final InvestmentService investmentService;

    @Autowired
    public InvestmentController(InvestmentService investmentService) {
        this.investmentService = investmentService;
    }

    // ==================== InvestmentAsset Endpoints ====================
    
    @PostMapping("/assets")
    public ResponseEntity<InvestmentAsset> createAsset(@RequestBody InvestmentAsset asset) {
        InvestmentAsset createdAsset = investmentService.createAsset(asset);
        return new ResponseEntity<>(createdAsset, HttpStatus.CREATED);
    }

    @GetMapping("/assets/{id}")
    public ResponseEntity<InvestmentAsset> getAssetById(@PathVariable Long id) {
        return investmentService.getAssetById(id)
                .map(asset -> new ResponseEntity<>(asset, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/assets")
    public ResponseEntity<List<InvestmentAsset>> getAllAssets() {
        List<InvestmentAsset> assets = investmentService.getAllAssets();
        return new ResponseEntity<>(assets, HttpStatus.OK);
    }

    @PutMapping("/assets/{id}")
    public ResponseEntity<InvestmentAsset> updateAsset(@PathVariable Long id, @RequestBody InvestmentAsset assetDetails) {
        try {
            InvestmentAsset updatedAsset = investmentService.updateAsset(id, assetDetails);
            return new ResponseEntity<>(updatedAsset, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/assets/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {
        try {
            investmentService.deleteAsset(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/assets/symbol/{symbol}")
    public ResponseEntity<InvestmentAsset> getAssetBySymbol(@PathVariable String symbol) {
        return investmentService.getAssetBySymbol(symbol)
                .map(asset -> new ResponseEntity<>(asset, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/assets/category/{category}")
    public ResponseEntity<List<InvestmentAsset>> getAssetsByCategory(@PathVariable AssetCategory category) {
        List<InvestmentAsset> assets = investmentService.getAssetsByCategory(category);
        return new ResponseEntity<>(assets, HttpStatus.OK);
    }

    @GetMapping("/assets/risk/{riskLevel}")
    public ResponseEntity<List<InvestmentAsset>> getAssetsByRiskLevel(@PathVariable RiskLevel riskLevel) {
        List<InvestmentAsset> assets = investmentService.getAssetsByRiskLevel(riskLevel);
        return new ResponseEntity<>(assets, HttpStatus.OK);
    }

    // ==================== InvestmentOrder Endpoints ====================
    
    @PostMapping("/orders")
    public ResponseEntity<InvestmentOrder> createOrder(@RequestBody InvestmentOrder order) {
        try {
            InvestmentOrder createdOrder = investmentService.createOrder(order);
            return new ResponseEntity<>(createdOrder, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<InvestmentOrder> getOrderById(@PathVariable Long id) {
        return investmentService.getOrderById(id)
                .map(order -> new ResponseEntity<>(order, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<InvestmentOrder>> getAllOrders() {
        List<InvestmentOrder> orders = investmentService.getAllOrders();
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    @PutMapping("/orders/{id}")
    public ResponseEntity<InvestmentOrder> updateOrder(@PathVariable Long id, @RequestBody InvestmentOrder orderDetails) {
        try {
            InvestmentOrder updatedOrder = investmentService.updateOrder(id, orderDetails);
            return new ResponseEntity<>(updatedOrder, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        try {
            investmentService.deleteOrder(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/orders/user/{userId}")
    public ResponseEntity<List<InvestmentOrder>> getOrdersByUserId(@PathVariable Long userId) {
        List<InvestmentOrder> orders = investmentService.getOrdersByUserId(userId);
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    @GetMapping("/orders/asset/{assetId}")
    public ResponseEntity<List<InvestmentOrder>> getOrdersByAssetId(@PathVariable Long assetId) {
        List<InvestmentOrder> orders = investmentService.getOrdersByAssetId(assetId);
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    @GetMapping("/orders/status/{status}")
    public ResponseEntity<List<InvestmentOrder>> getOrdersByStatus(@PathVariable OrderStatus status) {
        List<InvestmentOrder> orders = investmentService.getOrdersByStatus(status);
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    @GetMapping("/orders/user/{userId}/status/{status}")
    public ResponseEntity<List<InvestmentOrder>> getOrdersByUserIdAndStatus(@PathVariable Long userId, @PathVariable OrderStatus status) {
        List<InvestmentOrder> orders = investmentService.getOrdersByUserIdAndStatus(userId, status);
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    // ==================== InvestmentStrategy Endpoints ====================
    
    @PostMapping("/strategies")
    public ResponseEntity<InvestmentStrategy> createStrategy(@RequestBody InvestmentStrategy strategy) {
        try {
            InvestmentStrategy createdStrategy = investmentService.createStrategy(strategy);
            return new ResponseEntity<>(createdStrategy, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/strategies/{id}")
    public ResponseEntity<InvestmentStrategy> getStrategyById(@PathVariable Long id) {
        return investmentService.getStrategyById(id)
                .map(strategy -> new ResponseEntity<>(strategy, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/strategies")
    public ResponseEntity<List<InvestmentStrategy>> getAllStrategies() {
        List<InvestmentStrategy> strategies = investmentService.getAllStrategies();
        return new ResponseEntity<>(strategies, HttpStatus.OK);
    }

    @PutMapping("/strategies/{id}")
    public ResponseEntity<InvestmentStrategy> updateStrategy(@PathVariable Long id, @RequestBody InvestmentStrategy strategyDetails) {
        try {
            InvestmentStrategy updatedStrategy = investmentService.updateStrategy(id, strategyDetails);
            return new ResponseEntity<>(updatedStrategy, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/strategies/{id}")
    public ResponseEntity<Void> deleteStrategy(@PathVariable Long id) {
        try {
            investmentService.deleteStrategy(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/strategies/user/{userId}")
    public ResponseEntity<List<InvestmentStrategy>> getStrategiesByUserId(@PathVariable Long userId) {
        List<InvestmentStrategy> strategies = investmentService.getStrategiesByUserId(userId);
        return new ResponseEntity<>(strategies, HttpStatus.OK);
    }

    @GetMapping("/strategies/active/{isActive}")
    public ResponseEntity<List<InvestmentStrategy>> getStrategiesByActiveStatus(@PathVariable Boolean isActive) {
        List<InvestmentStrategy> strategies = investmentService.getStrategiesByActiveStatus(isActive);
        return new ResponseEntity<>(strategies, HttpStatus.OK);
    }

    @GetMapping("/strategies/user/{userId}/active/{isActive}")
    public ResponseEntity<List<InvestmentStrategy>> getStrategiesByUserIdAndActiveStatus(@PathVariable Long userId, @PathVariable Boolean isActive) {
        List<InvestmentStrategy> strategies = investmentService.getStrategiesByUserIdAndActiveStatus(userId, isActive);
        return new ResponseEntity<>(strategies, HttpStatus.OK);
    }

    // ==================== PortfolioPosition Endpoints ====================
    
    @PostMapping("/positions")
    public ResponseEntity<PortfolioPosition> createPosition(@RequestBody PortfolioPosition position) {
        try {
            PortfolioPosition createdPosition = investmentService.createPosition(position);
            return new ResponseEntity<>(createdPosition, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/positions/{id}")
    public ResponseEntity<PortfolioPosition> getPositionById(@PathVariable Long id) {
        return investmentService.getPositionById(id)
                .map(position -> new ResponseEntity<>(position, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/positions")
    public ResponseEntity<List<PortfolioPosition>> getAllPositions() {
        List<PortfolioPosition> positions = investmentService.getAllPositions();
        return new ResponseEntity<>(positions, HttpStatus.OK);
    }

    @PutMapping("/positions/{id}")
    public ResponseEntity<PortfolioPosition> updatePosition(@PathVariable Long id, @RequestBody PortfolioPosition positionDetails) {
        try {
            PortfolioPosition updatedPosition = investmentService.updatePosition(id, positionDetails);
            return new ResponseEntity<>(updatedPosition, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/positions/{id}")
    public ResponseEntity<Void> deletePosition(@PathVariable Long id) {
        try {
            investmentService.deletePosition(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/positions/user/{userId}")
    public ResponseEntity<List<PortfolioPosition>> getPositionsByUserId(@PathVariable Long userId) {
        List<PortfolioPosition> positions = investmentService.getPositionsByUserId(userId);
        return new ResponseEntity<>(positions, HttpStatus.OK);
    }

    @GetMapping("/positions/asset/{assetId}")
    public ResponseEntity<List<PortfolioPosition>> getPositionsByAssetId(@PathVariable Long assetId) {
        List<PortfolioPosition> positions = investmentService.getPositionsByAssetId(assetId);
        return new ResponseEntity<>(positions, HttpStatus.OK);
    }

    @GetMapping("/positions/user/{userId}/asset/{assetId}")
    public ResponseEntity<PortfolioPosition> getPositionByUserIdAndAssetId(@PathVariable Long userId, @PathVariable Long assetId) {
        return investmentService.getPositionByUserIdAndAssetId(userId, assetId)
                .map(position -> new ResponseEntity<>(position, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
}
