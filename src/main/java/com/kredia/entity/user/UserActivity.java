package com.kredia.entity.user;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "user_activity",
        indexes = {
                @Index(name = "idx_user_activity_user_id", columnList = "user_id"),
                @Index(name = "idx_user_activity_timestamp", columnList = "timestamp"),
                @Index(name = "idx_user_activity_action_type", columnList = "action_type"),
                @Index(name = "idx_user_activity_target_user", columnList = "target_user_id")
        }
)
public class UserActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "target_user_id")
    private Long targetUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private UserActivityActionType actionType;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(length = 128)
    private String device;

    @Column(length = 20)
    private String severity;

    @Column(length = 256)
    private String location;

    @Column(nullable = false)
    private Instant timestamp;

    public UserActivity() {
    }

    @PrePersist
    public void prePersist() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }

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

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getDevice() { return device; }
    public void setDevice(String device) { this.device = device; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
