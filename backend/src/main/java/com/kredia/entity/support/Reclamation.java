package com.kredia.entity.support;

import com.kredia.enums.Priority;
import com.kredia.enums.ReclamationCategory;
import com.kredia.enums.ReclamationRiskLevel;
import com.kredia.enums.ReclamationStatus;
import com.kredia.persistence.ReclamationRiskLevelConverter;
import jakarta.persistence.*;
import lombok.*;

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
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
