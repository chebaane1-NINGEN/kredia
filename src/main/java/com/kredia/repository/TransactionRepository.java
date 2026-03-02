package com.kredia.repository;

import com.kredia.entity.wallet.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findBySourceWallet_WalletId(Long walletId);
    List<Transaction> findByDestinationWallet_WalletId(Long walletId);

    // Fraud detection queries
    List<Transaction> findByStatus(com.kredia.enums.TransactionStatus status);
    
    @org.springframework.data.jpa.repository.Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.sourceWallet.walletId = :walletId AND t.transactionDate >= :startDate")
    java.math.BigDecimal sumOutgoingTransactionsSince(@org.springframework.data.repository.query.Param("walletId") Long walletId, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(t) FROM Transaction t WHERE t.sourceWallet.walletId = :walletId AND t.transactionDate >= :startDate")
    long countOutgoingTransactionsSince(@org.springframework.data.repository.query.Param("walletId") Long walletId, @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate);
}
