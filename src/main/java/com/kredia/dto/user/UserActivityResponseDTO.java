package com.kredia.dto.user;

import com.kredia.entity.user.UserActivityActionType;

import java.time.Instant;

public class UserActivityResponseDTO {

    private Long id;
    private Long userId;
    private Long targetUserId;
    private UserActivityActionType actionType;
    private String description;
    private String metadata;
    private String ipAddress;
    private String userAgent;
    private String device;
    private String severity;
    private String location;
    private Instant timestamp;
    private String userName;
    private String targetUserName;

    public UserActivityResponseDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getTargetUserId() { return targetUserId; }
    public void setTargetUserId(Long targetUserId) { this.targetUserId = targetUserId; }

    public UserActivityActionType getActionType() { return actionType; }
    public void setActionType(UserActivityActionType actionType) { this.actionType = actionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getTargetUserName() { return targetUserName; }
    public void setTargetUserName(String targetUserName) { this.targetUserName = targetUserName; }
}
