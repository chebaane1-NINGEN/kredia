package com.kredia.service;

import com.kredia.entity.wallet.Transaction;
import com.kredia.entity.wallet.Wallet;
import com.kredia.enums.TransactionStatus;
import com.kredia.repository.TransactionRepository;
import com.kredia.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final TransactionAuditLogService auditLogService;

    @Autowired
    public TransactionService(TransactionRepository transactionRepository, 
                              WalletRepository walletRepository,
                              TransactionAuditLogService auditLogService) {
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
        this.auditLogService = auditLogService;
    }

    public Transaction createTransaction(Transaction transaction) {
        if (transaction.getSourceWallet() == null || transaction.getSourceWallet().getWalletId() == null) {
            throw new IllegalArgumentException("Source wallet must be provided");
        }
        Wallet sourceWallet = walletRepository.findById(transaction.getSourceWallet().getWalletId())
                .orElseThrow(() -> new RuntimeException("Source wallet not found"));
        transaction.setSourceWallet(sourceWallet);

        if (transaction.getDestinationWallet() != null && transaction.getDestinationWallet().getWalletId() != null) {
             Wallet destinationWallet = walletRepository.findById(transaction.getDestinationWallet().getWalletId())
                    .orElseThrow(() -> new RuntimeException("Destination wallet not found"));
             transaction.setDestinationWallet(destinationWallet);
        }

        if (transaction.getTransactionDate() == null) {
            transaction.setTransactionDate(LocalDateTime.now());
        }
        if (transaction.getStatus() == null) {
            transaction.setStatus(TransactionStatus.PENDING);
        }
        Transaction savedTransaction = transactionRepository.save(transaction);
        
        // Audit the transaction
        auditLogService.auditTransaction(savedTransaction);
        
        return savedTransaction;
    }

    public Transaction updateTransactionStatus(Long transactionId, TransactionStatus status) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        transaction.setStatus(status);
        Transaction updatedTransaction = transactionRepository.save(transaction);
        
        // Audit the status change
        auditLogService.auditTransaction(updatedTransaction);
        
        return updatedTransaction;
    }

    public Transaction updateTransaction(Long transactionId, Transaction newTransactionDetails) {
        return transactionRepository.findById(transactionId).map(transaction -> {
            if (newTransactionDetails.getAmount() != null) {
                transaction.setAmount(newTransactionDetails.getAmount());
            }
            if (newTransactionDetails.getStatus() != null) {
                transaction.setStatus(newTransactionDetails.getStatus());
            }
            if (newTransactionDetails.getDescription() != null) {
                transaction.setDescription(newTransactionDetails.getDescription());
            }
             if (newTransactionDetails.getReference() != null) {
                transaction.setReference(newTransactionDetails.getReference());
            }
            return transactionRepository.save(transaction);
        }).orElseThrow(() -> new RuntimeException("Transaction not found"));
    }

    public void deleteTransaction(Long transactionId) {
        if (!transactionRepository.existsById(transactionId)) {
            throw new RuntimeException("Transaction not found");
        }
        transactionRepository.deleteById(transactionId);
    }

    public Optional<Transaction> getTransaction(Long transactionId) {
        return transactionRepository.findById(transactionId);
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
}
