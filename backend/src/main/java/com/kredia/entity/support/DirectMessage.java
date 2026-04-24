package com.kredia.entity.support;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "direct_message",
        indexes = {
                @Index(name = "idx_dm_sender_receiver", columnList = "sender_id,receiver_id"),
                @Index(name = "idx_dm_created_at", columnList = "created_at")
        }
)
public class DirectMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Long senderId;
        private Long receiverId;
        private String content;
        private LocalDateTime createdAt;
        private boolean read = false;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder senderId(Long senderId) {
            this.senderId = senderId;
            return this;
        }

        public Builder receiverId(Long receiverId) {
            this.receiverId = receiverId;
            return this;
        }

        public Builder content(String content) {
            this.content = content;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder read(boolean read) {
            this.read = read;
            return this;
        }

        public DirectMessage build() {
            DirectMessage message = new DirectMessage();
            message.id = this.id;
            message.senderId = this.senderId;
            message.receiverId = this.receiverId;
            message.content = this.content;
            message.createdAt = this.createdAt;
            message.read = this.read;
            return message;
        }
    }
}
