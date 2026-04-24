package com.kredia.entity.support;

import com.kredia.enums.Priority;
import com.kredia.enums.ReclamationCategory;
import com.kredia.enums.ReclamationRiskLevel;
import com.kredia.enums.ReclamationStatus;
import com.kredia.persistence.ReclamationRiskLevelConverter;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "reclamation",
        indexes = {
                @Index(name = "idx_rec_user_status", columnList = "user_id,status"),
                @Index(name = "idx_rec_status", columnList = "status"),
                @Index(name = "idx_rec_priority", columnList = "priority"),
                @Index(name = "idx_rec_category", columnList = "category"),
                @Index(name = "idx_rec_created", columnList = "created_at"),
                @Index(name = "idx_rec_last_activity", columnList = "last_activity_at"),
                @Index(name = "idx_rec_first_response_due", columnList = "first_response_due_at"),
                @Index(name = "idx_rec_resolution_due", columnList = "resolution_due_at")
        }
)
public class Reclamation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reclamation_id")
    private Long reclamationId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 150)
    private String subject;

    @Lob
    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReclamationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReclamationCategory category;

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "duplicate_count", nullable = false)
    private int duplicateCount;

    @Column(name = "risk_score")
    private Double riskScore;

    @Column(name = "risk_level", nullable = false)
    @Convert(converter = ReclamationRiskLevelConverter.class)
    private ReclamationRiskLevel riskLevel;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "first_response_at")
    private LocalDateTime firstResponseAt;

    @Column(name = "first_response_due_at")
    private LocalDateTime firstResponseDueAt;

    @Column(name = "resolution_due_at")
    private LocalDateTime resolutionDueAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "customer_satisfaction_score")
    private Integer customerSatisfactionScore;

    @Column(name = "customer_feedback", length = 500)
    private String customerFeedback;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastActivityAt = createdAt;
        if (status == null) status = ReclamationStatus.OPEN;
        if (priority == null) priority = Priority.MEDIUM;
        if (category == null) category = ReclamationCategory.OTHER;
        if (riskLevel == null) riskLevel = ReclamationRiskLevel.LOW;
        if (duplicateCount < 0) duplicateCount = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        lastActivityAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getReclamationId() {
        return reclamationId;
    }

    public void setReclamationId(Long reclamationId) {
        this.reclamationId = reclamationId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ReclamationStatus getStatus() {
        return status;
    }

    public void setStatus(ReclamationStatus status) {
        this.status = status;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public ReclamationCategory getCategory() {
        return category;
    }

    public void setCategory(ReclamationCategory category) {
        this.category = category;
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
    }

    public int getDuplicateCount() {
        return duplicateCount;
    }

    public void setDuplicateCount(int duplicateCount) {
        this.duplicateCount = duplicateCount;
    }

    public Double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Double riskScore) {
        this.riskScore = riskScore;
    }

    public ReclamationRiskLevel getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(ReclamationRiskLevel riskLevel) {
        this.riskLevel = riskLevel;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastActivityAt() {
        return lastActivityAt;
    }

    public void setLastActivityAt(LocalDateTime lastActivityAt) {
        this.lastActivityAt = lastActivityAt;
    }

    public LocalDateTime getFirstResponseAt() {
        return firstResponseAt;
    }

    public void setFirstResponseAt(LocalDateTime firstResponseAt) {
        this.firstResponseAt = firstResponseAt;
    }

    public LocalDateTime getFirstResponseDueAt() {
        return firstResponseDueAt;
    }

    public void setFirstResponseDueAt(LocalDateTime firstResponseDueAt) {
        this.firstResponseDueAt = firstResponseDueAt;
    }

    public LocalDateTime getResolutionDueAt() {
        return resolutionDueAt;
    }

    public void setResolutionDueAt(LocalDateTime resolutionDueAt) {
        this.resolutionDueAt = resolutionDueAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public Integer getCustomerSatisfactionScore() {
        return customerSatisfactionScore;
    }

    public void setCustomerSatisfactionScore(Integer customerSatisfactionScore) {
        this.customerSatisfactionScore = customerSatisfactionScore;
    }

    public String getCustomerFeedback() {
        return customerFeedback;
    }

    public void setCustomerFeedback(String customerFeedback) {
        this.customerFeedback = customerFeedback;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long reclamationId;
        private Long userId;
        private String subject;
        private String description;
        private ReclamationStatus status;
        private Priority priority;
        private ReclamationCategory category;
        private Long assignedTo;
        private int duplicateCount;
        private Double riskScore;
        private ReclamationRiskLevel riskLevel;
        private LocalDateTime createdAt;
        private LocalDateTime lastActivityAt;
        private LocalDateTime firstResponseAt;
        private LocalDateTime firstResponseDueAt;
        private LocalDateTime resolutionDueAt;
        private LocalDateTime resolvedAt;
        private Integer customerSatisfactionScore;
        private String customerFeedback;

        public Builder reclamationId(Long reclamationId) {
            this.reclamationId = reclamationId;
            return this;
        }

        public Builder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Builder subject(String subject) {
            this.subject = subject;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder status(ReclamationStatus status) {
            this.status = status;
            return this;
        }

        public Builder priority(Priority priority) {
            this.priority = priority;
            return this;
        }

        public Builder category(ReclamationCategory category) {
            this.category = category;
            return this;
        }

        public Builder assignedTo(Long assignedTo) {
            this.assignedTo = assignedTo;
            return this;
        }

        public Builder duplicateCount(int duplicateCount) {
            this.duplicateCount = duplicateCount;
            return this;
        }

        public Builder riskScore(Double riskScore) {
            this.riskScore = riskScore;
            return this;
        }

        public Builder riskLevel(ReclamationRiskLevel riskLevel) {
            this.riskLevel = riskLevel;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder lastActivityAt(LocalDateTime lastActivityAt) {
            this.lastActivityAt = lastActivityAt;
            return this;
        }

        public Builder firstResponseAt(LocalDateTime firstResponseAt) {
            this.firstResponseAt = firstResponseAt;
            return this;
        }

        public Builder firstResponseDueAt(LocalDateTime firstResponseDueAt) {
            this.firstResponseDueAt = firstResponseDueAt;
            return this;
        }

        public Builder resolutionDueAt(LocalDateTime resolutionDueAt) {
            this.resolutionDueAt = resolutionDueAt;
            return this;
        }

        public Builder resolvedAt(LocalDateTime resolvedAt) {
            this.resolvedAt = resolvedAt;
            return this;
        }

        public Builder customerSatisfactionScore(Integer customerSatisfactionScore) {
            this.customerSatisfactionScore = customerSatisfactionScore;
            return this;
        }

        public Builder customerFeedback(String customerFeedback) {
            this.customerFeedback = customerFeedback;
            return this;
        }

        public Reclamation build() {
            Reclamation reclamation = new Reclamation();
            reclamation.reclamationId = this.reclamationId;
            reclamation.userId = this.userId;
            reclamation.subject = this.subject;
            reclamation.description = this.description;
            reclamation.status = this.status;
            reclamation.priority = this.priority;
            reclamation.category = this.category;
            reclamation.assignedTo = this.assignedTo;
            reclamation.duplicateCount = this.duplicateCount;
            reclamation.riskScore = this.riskScore;
            reclamation.riskLevel = this.riskLevel;
            reclamation.createdAt = this.createdAt;
            reclamation.lastActivityAt = this.lastActivityAt;
            reclamation.firstResponseAt = this.firstResponseAt;
            reclamation.firstResponseDueAt = this.firstResponseDueAt;
            reclamation.resolutionDueAt = this.resolutionDueAt;
            reclamation.resolvedAt = this.resolvedAt;
            reclamation.customerSatisfactionScore = this.customerSatisfactionScore;
            reclamation.customerFeedback = this.customerFeedback;
            return reclamation;
        }
    }
}
