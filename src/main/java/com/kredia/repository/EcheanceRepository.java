package com.kredia.repository;

import com.kredia.entity.credit.Echeance;
import com.kredia.enums.EcheanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface EcheanceRepository extends JpaRepository<Echeance, Long> {

    /** Sum of outstanding balance for echeances > 30 days late. */
    /** Sum of amount_due for echeances > 30 days late. */
    @Query(value = "SELECT SUM(amount_due) FROM echeance WHERE due_date < :cutoffDate AND status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')", nativeQuery = true)
    Optional<BigDecimal> sumPar30AmountDue(@Param("cutoffDate") LocalDate cutoffDate);

    /** Sum of amount_paid for echeances > 30 days late. */
    @Query(value = "SELECT SUM(amount_paid) FROM echeance WHERE due_date < :cutoffDate AND status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')", nativeQuery = true)
    Optional<BigDecimal> sumPar30AmountPaid(@Param("cutoffDate") LocalDate cutoffDate);

    /** Total amount_due for all active loans. */
    @Query(value = "SELECT SUM(amount_due) FROM echeance WHERE status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')", nativeQuery = true)
    Optional<BigDecimal> sumTotalAmountDue();

    /** Total amount_paid for all active loans. */
    @Query(value = "SELECT SUM(amount_paid) FROM echeance WHERE status IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')", nativeQuery = true)
    Optional<BigDecimal> sumTotalAmountPaid();

    /** Count loans in default (status = OVERDUE). */
    long countByStatus(EcheanceStatus status);
}
