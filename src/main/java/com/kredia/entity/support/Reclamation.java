package com.kredia.entity.support;

import com.kredia.enums.Priority;
import com.kredia.enums.ReclamationRiskLevel;
import com.kredia.enums.ReclamationStatus;
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
                @Index(name = "idx_rec_created", columnList = "created_at"),
                @Index(name = "idx_rec_last_activity", columnList = "last_activity_at")
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

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "risk_score")
    private Double riskScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    private ReclamationRiskLevel riskLevel;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastActivityAt = createdAt;
        if (status == null) status = ReclamationStatus.OPEN;
        if (priority == null) priority = Priority.MEDIUM;
        if (riskLevel == null) riskLevel = ReclamationRiskLevel.LOW;
    }

    @PreUpdate
    protected void onUpdate() {
        lastActivityAt = LocalDateTime.now();
    }
}
