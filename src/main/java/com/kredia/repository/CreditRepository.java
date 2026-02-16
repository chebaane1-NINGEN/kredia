package com.kredia.repository;

import com.kredia.entity.credit.Credit;
import com.kredia.enums.CreditStatus;
import com.kredia.enums.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CreditRepository extends JpaRepository<Credit, Long> {

    List<Credit> findByUserUserId(Long userId);

    // ─── Client-scoped aggregations ───────────────────────────────────

    /** Count all credits for a given user. */
    long countByUserUserId(Long userId);

    /** Count credits for a user filtered by status. */
    long countByUserUserIdAndStatus(Long userId, CreditStatus status);

    /** Sum of approved loan amounts for a user. Returns null if no rows. */
    @Query("SELECT SUM(c.amount) FROM Credit c WHERE c.user.userId = :uid AND c.status = :status")
    Optional<Double> sumApprovedAmountByUser(@Param("uid") Long userId, @Param("status") CreditStatus status);

    /**
     * Average loan amount across all credits for a user. Returns null if no rows.
     */
    @Query("SELECT AVG(c.amount) FROM Credit c WHERE c.user.userId = :uid")
    Optional<Double> avgAmountByUser(@Param("uid") Long userId);

    /** Find the most recent risk level assigned to a user's credits. */
    @Query("SELECT c.riskLevel FROM Credit c WHERE c.user.userId = :uid AND c.riskLevel IS NOT NULL ORDER BY c.createdAt DESC")
    List<RiskLevel> findRiskLevelsByUser(@Param("uid") Long userId);

    // ─── Employee-scoped aggregations ─────────────────────────────────

    /** Count credits handled by a specific employee. */
    long countByHandledBy(Long employeeId);

    /** Count credits handled by employee with a given status. */
    long countByHandledByAndStatus(Long employeeId, CreditStatus status);

    /** Count credits handled by employee with a given risk level. */
    long countByHandledByAndRiskLevel(Long employeeId, RiskLevel riskLevel);

    /** All credits handled by a given employee (for decision-time calculation). */
    List<Credit> findByHandledBy(Long employeeId);

    // ─── Platform-wide aggregations (Admin) ───────────────────────────

    /** Count all credits. */
    @Query("SELECT COUNT(c) FROM Credit c")
    long countTotalLoans();

    /** Legacy count by status */
    long countByStatus(CreditStatus status);

    /** Count approved credits. */
    @Query("SELECT COUNT(c) FROM Credit c WHERE c.status = com.kredia.enums.CreditStatus.APPROVED")
    long countApprovedLoans();

    /** Count rejected credits. */
    @Query("SELECT COUNT(c) FROM Credit c WHERE c.status = com.kredia.enums.CreditStatus.REJECTED")
    long countRejectedLoans();

    /** Sum of all requested loan amounts. */
    @Query(value = "SELECT SUM(amount) FROM credit", nativeQuery = true)
    Optional<Double> sumAllRequestedAmount();

    /** Sum of all approved loan amounts (Legacy string version). */
    @Query("SELECT SUM(c.amount) FROM Credit c WHERE c.status = com.kredia.enums.CreditStatus.APPROVED")
    Optional<Double> sumAllApprovedAmount(String status);

    /** Sum of all approved loan amounts. */
    @Query("SELECT SUM(c.amount) FROM Credit c WHERE c.status = com.kredia.enums.CreditStatus.APPROVED")
    Optional<Double> sumApprovedLoans();

    /** Average loan amount across all credits. */
    @Query("SELECT AVG(c.amount) FROM Credit c")
    Optional<Double> averageLoanAmount();

    /** Count all credits by risk level. */
    long countByRiskLevel(RiskLevel riskLevel);

    /** Sum of approved loan amounts with HIGH or VERY_HIGH risk. */
    @Query("SELECT SUM(c.amount) FROM Credit c WHERE c.status = :status AND (c.riskLevel = :riskHigh OR c.riskLevel = :riskVeryHigh)")
    Optional<Double> sumHighRiskApprovedAmount(@Param("status") CreditStatus status, @Param("riskHigh") RiskLevel riskHigh, @Param("riskVeryHigh") RiskLevel riskVeryHigh);

    /** Count of credits handled by each agent. */
    @Query("SELECT c.handledBy, COUNT(c) FROM Credit c WHERE c.handledBy IS NOT NULL GROUP BY c.handledBy")
    List<Object[]> countCreditsByAgent();

    /** Find all credits that have a decision date (for decision time calculation). */
    @Query("SELECT c FROM Credit c WHERE c.decisionDate IS NOT NULL AND c.createdAt IS NOT NULL")
    List<Credit> findAllWithDecision();

    /** Average decision time in hours. */
    @Query(value = "SELECT AVG(DATEDIFF(hour, created_at, decision_date)) FROM credit WHERE decision_date IS NOT NULL", nativeQuery = true)
    Optional<Double> avgDecisionTimeInHours();

    /** Time-series: Loan volume by day for the last 30 days. */
    @Query(value = "SELECT CAST(created_at AS DATE) as date, SUM(amount) as volume FROM credit WHERE created_at >= :since GROUP BY CAST(created_at AS DATE) ORDER BY date", nativeQuery = true)
    List<Object[]> getVolumeTimeSeries(@Param("since") LocalDateTime since);

    /** Time-series: User growth by day for the last 30 days (from users table). */
    // Note: This might be better in UserRepository, but I'll add it here if I need it joined, 
    // but actually UserRepository is cleaner.
}
