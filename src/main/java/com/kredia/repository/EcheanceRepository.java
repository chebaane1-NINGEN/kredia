package com.kredia.repository;

import com.kredia.entity.credit.Echeance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EcheanceRepository extends JpaRepository<Echeance, Long> {

    @Query(value = "SELECT e.* FROM echeance e " +
            "INNER JOIN `transaction` t ON t.echeance_id = e.echeance_id " +
            "WHERE e.status = 'PENDING'", nativeQuery = true)
    List<Echeance> findPendingEcheancesWithTransaction();

    @Query(value = "SELECT COUNT(*) FROM `transaction` t WHERE t.echeance_id = :echeanceId", nativeQuery = true)
    int countTransactionsByEcheanceId(@Param("echeanceId") Long echeanceId);

    @Query(value = "SELECT COALESCE(SUM(t.amount), 0) FROM `transaction` t WHERE t.echeance_id = :echeanceId", nativeQuery = true)
    java.math.BigDecimal sumTransactionAmountsByEcheanceId(@Param("echeanceId") Long echeanceId);

    @Query(value = "SELECT t.amount FROM `transaction` t WHERE t.echeance_id = :echeanceId ORDER BY t.transaction_date DESC LIMIT 1", nativeQuery = true)
    java.math.BigDecimal getLastTransactionAmountByEcheanceId(@Param("echeanceId") Long echeanceId);

    @Query("SELECT COUNT(e) FROM Echeance e WHERE e.credit.creditId = :creditId AND e.status = com.kredia.enums.EcheanceStatus.PENDING")
    long countPendingEcheancesByCreditId(@Param("creditId") Long creditId);

    @Query("SELECT e FROM Echeance e WHERE e.credit.creditId = :creditId AND (e.status = com.kredia.enums.EcheanceStatus.PENDING OR e.status = com.kredia.enums.EcheanceStatus.PARTIALLY_PAID) ORDER BY e.dueDate ASC")
    List<Echeance> findNextUnpaidEcheancesByCreditId(@Param("creditId") Long creditId);

    List<Echeance> findByCreditCreditId(Long creditId);
}
