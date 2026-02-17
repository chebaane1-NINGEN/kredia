package com.kredia.service;

import com.kredia.entity.wallet.Transaction;
import com.kredia.entity.wallet.TransactionAuditLog;
import com.kredia.repository.TransactionAuditLogRepository;
import com.kredia.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kredia.util.HashUtil;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TransactionAuditLogService {

    private final TransactionAuditLogRepository auditLogRepository;
    private final TransactionRepository transactionRepository;
    private final HederaService hederaService;

    @Autowired
    public TransactionAuditLogService(TransactionAuditLogRepository auditLogRepository, 
                                      TransactionRepository transactionRepository,
                                      HederaService hederaService) {
        this.auditLogRepository = auditLogRepository;
        this.transactionRepository = transactionRepository;
        this.hederaService = hederaService;
    }

    public TransactionAuditLog createAuditLog(Long transactionId, String dataHash, String previousHash, String blockchainTxHash) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + transactionId));

        TransactionAuditLog log = new TransactionAuditLog();
        log.setTransaction(transaction);
        log.setDataHash(dataHash);
        log.setPreviousHash(previousHash);
        
        // If blockchainTxHash is not provided, send dataHash to Hedera
        if (blockchainTxHash == null || blockchainTxHash.isEmpty()) {
            blockchainTxHash = hederaService.sendToConsensusService(dataHash);
        }
        
        log.setBlockchainTxHash(blockchainTxHash);
        log.setCreatedAt(LocalDateTime.now());

        return auditLogRepository.save(log);
    }
    
    public TransactionAuditLog createAuditLog(TransactionAuditLog log) {
         if (log.getTransaction() != null && log.getTransaction().getTransactionId() != null) {
              Transaction transaction = transactionRepository.findById(log.getTransaction().getTransactionId())
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + log.getTransaction().getTransactionId()));
              log.setTransaction(transaction);
         }
         
         // Integrate with Hedera if blockchainTxHash is missing
         if ((log.getBlockchainTxHash() == null || log.getBlockchainTxHash().isEmpty()) && log.getDataHash() != null) {
             String hederaTxId = hederaService.sendToConsensusService(log.getDataHash());
             log.setBlockchainTxHash(hederaTxId);
         }

         if (log.getCreatedAt() == null) {
             log.setCreatedAt(LocalDateTime.now());
         }
         return auditLogRepository.save(log);
    }


    public TransactionAuditLog updateAuditLog(Long logId, TransactionAuditLog newLogDetails) {
        return auditLogRepository.findById(logId).map(log -> {
            if (newLogDetails.getDataHash() != null) {
                log.setDataHash(newLogDetails.getDataHash());
            }
            if (newLogDetails.getPreviousHash() != null) {
                log.setPreviousHash(newLogDetails.getPreviousHash());
            }
            if (newLogDetails.getBlockchainTxHash() != null) {
                log.setBlockchainTxHash(newLogDetails.getBlockchainTxHash());
            }
            return auditLogRepository.save(log);
        }).orElseThrow(() -> new RuntimeException("Audit log not found with id: " + logId));
    }

    public void deleteAuditLog(Long logId) {
        if (!auditLogRepository.existsById(logId)) {
            throw new RuntimeException("Audit log not found with id: " + logId);
        }
        auditLogRepository.deleteById(logId);
    }

    public Optional<TransactionAuditLog> getAuditLog(Long logId) {
        return auditLogRepository.findById(logId);
    }

    public List<TransactionAuditLog> getAllAuditLogs() {
        return auditLogRepository.findAll();
    }

    public List<TransactionAuditLog> getAuditLogsByTransactionId(Long transactionId) {
        return auditLogRepository.findByTransaction_TransactionId(transactionId);
    }

    /**
     * Automatically creates an audit log for a transaction.
     * Calculates the hash of the transaction data and sends it to Hedera.
     */
    public TransactionAuditLog auditTransaction(Transaction transaction) {
        // Create a string representation of the transaction for hashing
        String transactionData = String.format("id:%d,amount:%f,status:%s,ref:%s,date:%s",
                transaction.getTransactionId(),
                transaction.getAmount() != null ? transaction.getAmount().doubleValue() : 0.0,
                transaction.getStatus(),
                transaction.getReference(),
                transaction.getTransactionDate());

        String dataHash = HashUtil.calculateHash(transactionData);
        
        // Find the last audit log to get the previous hash (simple chain logic)
        String previousHash = "0";
        List<TransactionAuditLog> logs = auditLogRepository.findAll(); // Optimization: could use a more specific query
        if (!logs.isEmpty()) {
            previousHash = logs.get(logs.size() - 1).getDataHash();
        }

        return createAuditLog(transaction.getTransactionId(), dataHash, previousHash, null);
    }
}
