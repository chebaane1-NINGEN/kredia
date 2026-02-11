package com.kredia.entity.support;

import com.kredia.enums.ReclamationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reclamation_history",
        indexes = {
                @Index(name = "idx_hist_reclamation", columnList = "reclamation_id"),
                @Index(name = "idx_hist_changed", columnList = "changed_at")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ReclamationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclamation_id", nullable = false)
    private Reclamation reclamation;

    @Column(name = "user_id", nullable = false)
    private Long userId; // who did the action (agent/admin/system)

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", nullable = false)
    private ReclamationStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false)
    private ReclamationStatus newStatus;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(length = 500)
    private String note;

    @PrePersist
    void onCreate() {
        changedAt = LocalDateTime.now();
    }
}
