package com.kredia.repository;

import com.kredia.entity.wallet.VirtualCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VirtualCardRepository extends JpaRepository<VirtualCard, Long> {
    List<VirtualCard> findByWallet_WalletId(Long walletId);

    Optional<VirtualCard> findFirstByWallet_WalletIdAndStatus(Long walletId, String status);
}
