package com.kredia.service;

import com.kredia.entity.wallet.Wallet;
import com.kredia.repository.WalletRepository;
import com.kredia.repository.UserRepository;
import com.kredia.enums.WalletStatus;
import com.kredia.entity.user.User;
import com.kredia.util.HashUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import com.kredia.repository.UserRepository;

@Service
@Transactional
public class WalletService {
    @Autowired
    private WalletRepository walletRepository;
    private final TransactionAuditLogService auditLogService;
    private final UserRepository userRepository;

    public WalletService(UserRepository userRepository, WalletRepository walletRepository,
            TransactionAuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.auditLogService = auditLogService;
    }

    public Wallet createWallet(Wallet wallet) {
        if (wallet.getUser() != null && wallet.getUser().getUserId() != null) {
            long userId = wallet.getUser().getUserId();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if user already has a wallet
            if (walletRepository.findByUser_UserId(userId).isPresent()) {
                throw new RuntimeException("This User already has an active wallet!");
            }

            wallet.setUser(user);
        }
        wallet.setStatus(WalletStatus.ACTIVE);
        // Date timestamps now handled correctly by @PrePersist/@PreUpdate inside the
        // Wallet entity.

        Wallet savedWallet = walletRepository.save(wallet);

        // Audit wallet creation
        auditWalletAction(savedWallet, "CREATE");

        return savedWallet;
    }

    public Wallet updateWalletStatus(Long walletId, WalletStatus walletStatus) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setStatus(walletStatus);
        wallet.setUpdatedAt(LocalDateTime.now());
        Wallet updatedWallet = walletRepository.save(wallet);

        // Audit status update
        auditWalletAction(updatedWallet, "UPDATE_STATUS");

        return updatedWallet;
    }

    public Wallet updateWallet(long walletId, Wallet newWalletDetails) {
        return walletRepository.findById(walletId).map(wallet -> {
            if (newWalletDetails.getBalance() != null) {
                wallet.setBalance(newWalletDetails.getBalance());
            }
            if (newWalletDetails.getFrozenBalance() != null) {
                wallet.setFrozenBalance(newWalletDetails.getFrozenBalance());
            }
            if (newWalletDetails.getStatus() != null) {
                wallet.setStatus(newWalletDetails.getStatus());
            }
            wallet.setUpdatedAt(LocalDateTime.now());
            Wallet updatedWallet = walletRepository.save(wallet);

            // Audit wallet update
            auditWalletAction(updatedWallet, "UPDATE");

            return updatedWallet;
        }).orElseThrow(() -> new RuntimeException("Wallet not found"));
    }

    public void deleteWallet(long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        // Audit deletion before it's gone
        auditWalletAction(wallet, "DELETE");

        walletRepository.deleteById(walletId);
    }

    /**
     * Internal helper to audit wallet actions to the blockchain
     */
    private void auditWalletAction(Wallet wallet, String action) {
        String walletData = String.format("action:%s,walletId:%d,balance:%s,status:%s,time:%s",
                action,
                wallet.getWalletId(),
                wallet.getBalance() != null ? wallet.getBalance().toString() : "0.00",
                wallet.getStatus(),
                LocalDateTime.now());

        String dataHash = HashUtil.calculateHash(walletData);

        // Find last audit log for chain
        String previousHash = "0";
        // This is a simplified approach, in production we might want a lastHash field
        // or a specific query
        var logs = auditLogService.getAllAuditLogs();
        if (!logs.isEmpty()) {
            previousHash = logs.get(logs.size() - 1).getDataHash();
        }

        // Technically TransactionAuditLog entity expects a Transaction relation.
        // If we want to audit non-transaction wallet actions, we might need to allow
        // null transaction
        // or create a dummy/virtual transaction record.
        // For now, I'll use the existing auditLogService logic which might need a null
        // check Adjustment.
        auditLogService.createAuditLog(null, dataHash, previousHash, null);
    }

    public void freezeWallet(Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        wallet.setStatus(WalletStatus.FROZEN);
        if (wallet.getBalance() != null && wallet.getBalance().compareTo(java.math.BigDecimal.ZERO) > 0) {
            wallet.setFrozenBalance(wallet.getFrozenBalance().add(wallet.getBalance()));
            wallet.setBalance(java.math.BigDecimal.ZERO);
        }
        wallet.setUpdatedAt(LocalDateTime.now());

        Wallet updatedWallet = walletRepository.save(wallet);

        // Audit freeze action
        auditWalletAction(updatedWallet, "FREEZE");
    }
}
