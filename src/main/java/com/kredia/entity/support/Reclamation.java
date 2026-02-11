package com.kredia.entity.support;

import com.kredia.enums.Priority;
import com.kredia.enums.ReclamationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reclamation",
        indexes = {
                @Index(name = "idx_rec_user_status", columnList = "user_id,status"),
                @Index(name = "idx_rec_status", columnList = "status"),
                @Index(name = "idx_rec_created", columnList = "created_at")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Reclamation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reclamation_id")
    private Long reclamationId;

    @Column(name = "user_id", nullable = false)
    private Long userId; // keep simple now; later you can map to User entity

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

    // ML field (Model 2)
    @Column(name = "risk_score")
    private Double riskScore; // 0..100

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = ReclamationStatus.OPEN;
        if (priority == null) priority = Priority.MEDIUM;
    }
}
