package com.kredia.repository;

import com.kredia.entity.wallet.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findBySourceWallet_WalletId(Long walletId);
    List<Transaction> findByDestinationWallet_WalletId(Long walletId);
}
