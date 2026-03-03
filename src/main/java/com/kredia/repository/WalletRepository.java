package com.kredia.repository;

import com.kredia.entity.wallet.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByUser_UserId(Long userId);
}
