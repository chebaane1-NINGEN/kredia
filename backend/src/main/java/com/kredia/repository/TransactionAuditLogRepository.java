package com.kredia.repository;

import com.kredia.entity.wallet.TransactionAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionAuditLogRepository extends JpaRepository<TransactionAuditLog, Long> {
    List<TransactionAuditLog> findByTransaction_TransactionId(Long transactionId);
}
