package com.kredia.repository;

import com.kredia.entity.wallet.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface    TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findBySourceWallet_WalletId(Long walletId);
    List<Transaction> findByDestinationWallet_WalletId(Long walletId);

    @Query(value = """
            SELECT t.amount
            FROM `transaction` t
            INNER JOIN wallet w ON w.wallet_id = t.wallet_id
            WHERE w.user_id = :userId
              AND t.status = 'COMPLETED'
            ORDER BY t.transaction_date DESC
            LIMIT 1
            """, nativeQuery = true)
    BigDecimal findLatestCompletedAmountByUserId(@Param("userId") Long userId);
}
