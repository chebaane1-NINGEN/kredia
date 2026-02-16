package com.kredia.entity.credit;

import com.kredia.user.entity.User;
import com.kredia.enums.DocumentTypeLoan;
import com.kredia.enums.KycStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_loan")
@Data
@NoArgsConstructor
@AllArgsConstructor
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
}
