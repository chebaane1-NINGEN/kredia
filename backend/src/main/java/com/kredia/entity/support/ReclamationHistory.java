package com.kredia.entity.support;

import com.kredia.enums.ReclamationStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reclamation_history",
        indexes = {
                @Index(name = "idx_hist_reclamation", columnList = "reclamation_id"),
                @Index(name = "idx_hist_changed", columnList = "changed_at")
        }
)
public class ReclamationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclamation_id", nullable = false)
    private Reclamation reclamation;

    @Column(name = "user_id")
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

    // Getters and Setters
    public Long getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Long historyId) {
        this.historyId = historyId;
    }

    public Reclamation getReclamation() {
        return reclamation;
    }

    public void setReclamation(Reclamation reclamation) {
        this.reclamation = reclamation;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public ReclamationStatus getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(ReclamationStatus oldStatus) {
        this.oldStatus = oldStatus;
    }

    public ReclamationStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(ReclamationStatus newStatus) {
        this.newStatus = newStatus;
    }

    public LocalDateTime getChangedAt() {
        return changedAt;
    }

    public void setChangedAt(LocalDateTime changedAt) {
        this.changedAt = changedAt;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long historyId;
        private Reclamation reclamation;
        private Long userId;
        private ReclamationStatus oldStatus;
        private ReclamationStatus newStatus;
        private LocalDateTime changedAt;
        private String note;

        public Builder historyId(Long historyId) {
            this.historyId = historyId;
            return this;
        }

        public Builder reclamation(Reclamation reclamation) {
            this.reclamation = reclamation;
            return this;
        }

        public Builder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public Builder oldStatus(ReclamationStatus oldStatus) {
            this.oldStatus = oldStatus;
            return this;
        }

        public Builder newStatus(ReclamationStatus newStatus) {
            this.newStatus = newStatus;
            return this;
        }

        public Builder changedAt(LocalDateTime changedAt) {
            this.changedAt = changedAt;
            return this;
        }

        public Builder note(String note) {
            this.note = note;
            return this;
        }

        public ReclamationHistory build() {
            ReclamationHistory history = new ReclamationHistory();
            history.historyId = this.historyId;
            history.reclamation = this.reclamation;
            history.userId = this.userId;
            history.oldStatus = this.oldStatus;
            history.newStatus = this.newStatus;
            history.changedAt = this.changedAt;
            history.note = this.note;
            return history;
        }
    }
}
