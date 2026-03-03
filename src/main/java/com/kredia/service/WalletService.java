package com.kredia.service;
import com.kredia.entity.wallet.Wallet;
import com.kredia.repository.WalletRepository;
import com.kredia.repository.UserRepository;
import com.kredia.enums.WalletStatus;
import com.kredia.entity.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@Transactional
public class WalletService {
    @Autowired
    private WalletRepository walletRepository;
    private UserRepository userRepository;
    public WalletService( UserRepository userRepository, WalletRepository walletRepository) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
    }
    public Wallet createWallet(Wallet wallet) {
        if (wallet.getUser() != null && wallet.getUser().getUserId() != null) {
            long userId = wallet.getUser().getUserId();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            wallet.setUser(user);
        }
        wallet.setStatus(WalletStatus.ACTIVE);
        wallet.setCreatedAt(LocalDateTime.now());
        wallet.setUpdatedAt(LocalDateTime.now());
        return walletRepository.save(wallet);
    }

    public Wallet updateWalletStatus(Long walletId, WalletStatus walletStatus) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        wallet.setStatus(walletStatus);
        wallet.setUpdatedAt(LocalDateTime.now());
        return walletRepository.save(wallet);
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
            return walletRepository.save(wallet);
        }).orElseThrow(() -> new RuntimeException("Wallet not found"));
    }

    public void deleteWallet(long walletId) {
        if (!walletRepository.existsById(walletId)) {
            throw new RuntimeException("Wallet not found");
        }
        walletRepository.deleteById(walletId);
    }
}
