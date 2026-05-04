package com.kredia.entity.user;

import com.kredia.enums.DocumentType;
import com.kredia.enums.KycStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_document")
@Data
@NoArgsConstructor
@AllArgsConstructor
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
    private DocumentType documentType;
    
    @Column(name = "file_path", nullable = false)
    private String filePath;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private KycStatus status = KycStatus.PENDING;
    
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
