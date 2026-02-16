package com.kredia.service;

import com.kredia.dto.WalletResponseDTO;
import com.kredia.entity.wallet.Wallet;
import com.kredia.repository.WalletRepository;
import com.kredia.user.entity.User;
import com.kredia.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    public WalletResponseDTO getMyWallet(Long userId) {
        Wallet wallet = walletRepository.findByUser_UserId(userId)
                .orElseGet(() -> createWalletForUser(userId));

        return mapToDTO(wallet);
    }

    private Wallet createWalletForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Wallet wallet = new Wallet();
        wallet.setUser(user);
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setFrozenBalance(BigDecimal.ZERO);
        
        return walletRepository.save(wallet);
    }

    private WalletResponseDTO mapToDTO(Wallet wallet) {
        return WalletResponseDTO.builder()
                .walletId(wallet.getWalletId())
                .balance(wallet.getBalance())
                .frozenBalance(wallet.getFrozenBalance())
                .status(wallet.getStatus())
                .createdAt(wallet.getCreatedAt())
                .build();
    }
}
