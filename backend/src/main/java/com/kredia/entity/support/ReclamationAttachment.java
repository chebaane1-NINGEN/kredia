package com.kredia.entity.support;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reclamation_attachment",
        indexes = {
                @Index(name = "idx_att_reclamation_uploaded", columnList = "reclamation_id,uploaded_at")
        }
)
public class ReclamationAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attachment_id")
    private Long attachmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reclamation_id", nullable = false)
    private Reclamation reclamation;

    @Column(name = "uploaded_by_user_id", nullable = false)
    private Long uploadedByUserId;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 1000)
    private String fileUrl;

    @Column(name = "content_type", length = 120)
    private String contentType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    void onCreate() {
        uploadedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getAttachmentId() {
        return attachmentId;
    }

    public void setAttachmentId(Long attachmentId) {
        this.attachmentId = attachmentId;
    }

    public Reclamation getReclamation() {
        return reclamation;
    }

    public void setReclamation(Reclamation reclamation) {
        this.reclamation = reclamation;
    }

    public Long getUploadedByUserId() {
        return uploadedByUserId;
    }

    public void setUploadedByUserId(Long uploadedByUserId) {
        this.uploadedByUserId = uploadedByUserId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long attachmentId;
        private Reclamation reclamation;
        private Long uploadedByUserId;
        private String fileName;
        private String fileUrl;
        private String contentType;
        private Long sizeBytes;
        private LocalDateTime uploadedAt;

        public Builder attachmentId(Long attachmentId) {
            this.attachmentId = attachmentId;
            return this;
        }

        public Builder reclamation(Reclamation reclamation) {
            this.reclamation = reclamation;
            return this;
        }

        public Builder uploadedByUserId(Long uploadedByUserId) {
            this.uploadedByUserId = uploadedByUserId;
            return this;
        }

        public Builder fileName(String fileName) {
            this.fileName = fileName;
            return this;
        }

        public Builder fileUrl(String fileUrl) {
            this.fileUrl = fileUrl;
            return this;
        }

        public Builder contentType(String contentType) {
            this.contentType = contentType;
            return this;
        }

        public Builder sizeBytes(Long sizeBytes) {
            this.sizeBytes = sizeBytes;
            return this;
        }

        public Builder uploadedAt(LocalDateTime uploadedAt) {
            this.uploadedAt = uploadedAt;
            return this;
        }

        public ReclamationAttachment build() {
            ReclamationAttachment attachment = new ReclamationAttachment();
            attachment.attachmentId = this.attachmentId;
            attachment.reclamation = this.reclamation;
            attachment.uploadedByUserId = this.uploadedByUserId;
            attachment.fileName = this.fileName;
            attachment.fileUrl = this.fileUrl;
            attachment.contentType = this.contentType;
            attachment.sizeBytes = this.sizeBytes;
            attachment.uploadedAt = this.uploadedAt;
            return attachment;
        }
    }
}
