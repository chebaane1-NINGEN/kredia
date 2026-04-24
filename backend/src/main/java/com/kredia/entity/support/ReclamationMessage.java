package com.kredia.entity.support;

import com.kredia.enums.ReclamationMessageVisibility;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reclamation_message",
        indexes = {
                @Index(name = "idx_msg_reclamation_created", columnList = "reclamation_id,created_at")
        }
)
public class ReclamationMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    private Long messageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclamation_id", nullable = false)
    private Reclamation reclamation;

    @Column(name = "author_user_id", nullable = false)
    private Long authorUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReclamationMessageVisibility visibility;

    @Lob
    @Column(nullable = false)
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public Reclamation getReclamation() {
        return reclamation;
    }

    public void setReclamation(Reclamation reclamation) {
        this.reclamation = reclamation;
    }

    public Long getAuthorUserId() {
        return authorUserId;
    }

    public void setAuthorUserId(Long authorUserId) {
        this.authorUserId = authorUserId;
    }

    public ReclamationMessageVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(ReclamationMessageVisibility visibility) {
        this.visibility = visibility;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long messageId;
        private Reclamation reclamation;
        private Long authorUserId;
        private ReclamationMessageVisibility visibility;
        private String message;
        private LocalDateTime createdAt;

        public Builder messageId(Long messageId) {
            this.messageId = messageId;
            return this;
        }

        public Builder reclamation(Reclamation reclamation) {
            this.reclamation = reclamation;
            return this;
        }

        public Builder authorUserId(Long authorUserId) {
            this.authorUserId = authorUserId;
            return this;
        }

        public Builder visibility(ReclamationMessageVisibility visibility) {
            this.visibility = visibility;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ReclamationMessage build() {
            ReclamationMessage reclamationMessage = new ReclamationMessage();
            reclamationMessage.messageId = this.messageId;
            reclamationMessage.reclamation = this.reclamation;
            reclamationMessage.authorUserId = this.authorUserId;
            reclamationMessage.visibility = this.visibility;
            reclamationMessage.message = this.message;
            reclamationMessage.createdAt = this.createdAt;
            return reclamationMessage;
        }
    }
}
