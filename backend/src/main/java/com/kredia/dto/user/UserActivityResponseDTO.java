package com.kredia.dto.user;

import com.kredia.entity.user.UserActivityActionType;

import java.time.Instant;

public class UserActivityResponseDTO {

    private Long id;
    private Long userId;
    private UserActivityActionType actionType;
    private String description;
    private Instant timestamp;
    private Long clientId;
    private String clientName;
    private String previousValue;
    private String newValue;
    private String context;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public UserActivityActionType getActionType() { return actionType; }
    public void setActionType(UserActivityActionType actionType) { this.actionType = actionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getPreviousValue() { return previousValue; }
    public void setPreviousValue(String previousValue) { this.previousValue = previousValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }

    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }
}
