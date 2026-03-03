package com.kredia.entity.wallet;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionAuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;
    
    @Column(name = "previous_hash", length = 256)
    private String previousHash;
    
    @Column(name = "data_hash", nullable = false, length = 256)
    private String dataHash;
    
    @Column(name = "blockchain_tx_hash", length = 256)
    private String blockchainTxHash;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
