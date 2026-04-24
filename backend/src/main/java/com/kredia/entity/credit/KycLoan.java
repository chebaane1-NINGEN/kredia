package com.kredia.entity.credit;

import com.kredia.entity.user.User;
import com.kredia.enums.DocumentTypeLoan;
import com.kredia.enums.KycStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_loan")
public class KycLoan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kyc_loan_id")
    private Long kycLoanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_id", nullable = false)
    private Credit credit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentTypeLoan documentType;

    @Column(name = "document_path", nullable = false, length = 150)
    private String documentPath;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "verified_status", nullable = false)
    private KycStatus verifiedStatus ;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getKycLoanId() {
        return kycLoanId;
    }

    public void setKycLoanId(Long kycLoanId) {
        this.kycLoanId = kycLoanId;
    }

    public Credit getCredit() {
        return credit;
    }

    public void setCredit(Credit credit) {
        this.credit = credit;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public DocumentTypeLoan getDocumentType() {
        return documentType;
    }

    public void setDocumentType(DocumentTypeLoan documentType) {
        this.documentType = documentType;
    }

    public String getDocumentPath() {
        return documentPath;
    }

    public void setDocumentPath(String documentPath) {
        this.documentPath = documentPath;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public KycStatus getVerifiedStatus() {
        return verifiedStatus;
    }

    public void setVerifiedStatus(KycStatus verifiedStatus) {
        this.verifiedStatus = verifiedStatus;
    }
}
