package com.kredia.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "user_activities", indexes = {
        @Index(name = "idx_user_activities_user_id", columnList = "user_id"),
        @Index(name = "idx_user_activities_timestamp", columnList = "timestamp")
})
public class UserActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private UserActivityActionType actionType;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private Instant timestamp;

    public UserActivity() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public UserActivityActionType getActionType() {
        return actionType;
    }

    public void setActionType(UserActivityActionType actionType) {
        this.actionType = actionType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
