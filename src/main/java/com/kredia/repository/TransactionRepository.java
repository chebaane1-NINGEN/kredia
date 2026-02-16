package com.kredia.repository;

import com.kredia.entity.wallet.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /** Count unique users who have at least one transaction. */
    @Query("SELECT COUNT(DISTINCT t.sourceWallet.user.userId) FROM Transaction t")
    long countUniqueTransactingUsers();
}
