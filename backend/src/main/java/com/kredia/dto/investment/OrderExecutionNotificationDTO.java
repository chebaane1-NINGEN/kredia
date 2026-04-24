package com.kredia.dto.investment;

import java.math.BigDecimal;

public class OrderExecutionNotificationDTO {
    private Long orderId;
    private Long userId;
    private String assetSymbol;
    private String orderType;
    private BigDecimal quantity;
    private BigDecimal executedPrice;
    private String executedAt;

    public OrderExecutionNotificationDTO() {
    }

    public OrderExecutionNotificationDTO(Long orderId, Long userId, String assetSymbol, String orderType, BigDecimal quantity, BigDecimal executedPrice, String executedAt) {
        this.orderId = orderId;
        this.userId = userId;
        this.assetSymbol = assetSymbol;
        this.orderType = orderType;
        this.quantity = quantity;
        this.executedPrice = executedPrice;
        this.executedAt = executedAt;
    }

    // Getters and Setters
    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getAssetSymbol() {
        return assetSymbol;
    }

    public void setAssetSymbol(String assetSymbol) {
        this.assetSymbol = assetSymbol;
    }

    public String getOrderType() {
        return orderType;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getExecutedPrice() {
        return executedPrice;
    }

    public void setExecutedPrice(BigDecimal executedPrice) {
        this.executedPrice = executedPrice;
    }

    public String getExecutedAt() {
        return executedAt;
    }

    public void setExecutedAt(String executedAt) {
        this.executedAt = executedAt;
    }
}
