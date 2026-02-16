package com.kredia.kyc.entity;

import com.kredia.enums.KycDocumentType;
import com.kredia.enums.KycStatus;
import com.kredia.user.entity.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_documents")
public class KycDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kyc_id")
    private Long kycId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private KycDocumentType documentType;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private KycStatus status;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verified_by")
    private Long verifiedBy;

    public KycDocument() {}

    public Long getKycId() { return kycId; }
    public void setKycId(Long kycId) { this.kycId = kycId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public KycDocumentType getDocumentType() { return documentType; }
    public void setDocumentType(KycDocumentType documentType) { this.documentType = documentType; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public KycStatus getStatus() { return status; }
    public void setStatus(KycStatus status) { this.status = status; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
    public Long getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(Long verifiedBy) { this.verifiedBy = verifiedBy; }

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
        if (status == null) {
            status = KycStatus.PENDING;
        }
    }
}
