package com.kredia.repository.audit;

import com.kredia.entity.audit.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Find audit logs by time range
     */
    @Query("SELECT a FROM AuditLog a WHERE a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    Page<AuditLog> findByTimestampBetween(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate, Pageable pageable);

    /**
     * Find audit logs by actor (who performed the action)
     */
    @Query("SELECT a FROM AuditLog a WHERE a.actorId = :actorId ORDER BY a.timestamp DESC")
    Page<AuditLog> findByActorId(@Param("actorId") Long actorId, Pageable pageable);

    /**
     * Find audit logs by target (who was affected)
     */
    @Query("SELECT a FROM AuditLog a WHERE a.targetId = :targetId ORDER BY a.timestamp DESC")
    Page<AuditLog> findByTargetId(@Param("targetId") Long targetId, Pageable pageable);

    /**
     * Find audit logs by action type
     */
    @Query("SELECT a FROM AuditLog a WHERE a.actionType = :actionType ORDER BY a.timestamp DESC")
    Page<AuditLog> findByActionType(@Param("actionType") AuditLog.AuditActionType actionType, Pageable pageable);

    /**
     * Find failed actions
     */
    @Query("SELECT a FROM AuditLog a WHERE a.status = 'FAILED' ORDER BY a.timestamp DESC")
    Page<AuditLog> findFailedActions(Pageable pageable);

    /**
     * Find high-severity actions
     */
    @Query("SELECT a FROM AuditLog a WHERE a.severity = 'HIGH' ORDER BY a.timestamp DESC")
    Page<AuditLog> findHighSeverityActions(Pageable pageable);

    /**
     * Complex filter: date range + action type + severity + status + actor + target + IP
     */
    @Query("SELECT a FROM AuditLog a WHERE " +
           "a.timestamp BETWEEN :startDate AND :endDate " +
           "AND (:actionType IS NULL OR a.actionType = :actionType) " +
           "AND (:severity IS NULL OR a.severity = :severity) " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:actorId IS NULL OR a.actorId = :actorId) " +
           "AND (:targetId IS NULL OR a.targetId = :targetId) " +
           "AND (:ipAddress IS NULL OR a.ipAddress = :ipAddress) " +
           "ORDER BY a.timestamp DESC")
    Page<AuditLog> findByMultipleCriteria(
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        @Param("actionType") AuditLog.AuditActionType actionType,
        @Param("severity") AuditLog.AuditSeverity severity,
        @Param("status") AuditLog.AuditStatus status,
        @Param("actorId") Long actorId,
        @Param("targetId") Long targetId,
        @Param("ipAddress") String ipAddress,
        Pageable pageable
    );

    /**
     * Statistics: count by action type for a time range
     */
    @Query("SELECT NEW map(a.actionType as action, count(a) as count) FROM AuditLog a " +
           "WHERE a.timestamp BETWEEN :start AND :end GROUP BY a.actionType")
    List<java.util.Map<String, Object>> countByActionTypeInRange(@Param("start") Instant start, @Param("end") Instant end);

    /**
     * Find logs by IP address (for security analysis)
     */
    @Query("SELECT a FROM AuditLog a WHERE a.ipAddress = :ip ORDER BY a.timestamp DESC")
    Page<AuditLog> findByIpAddress(@Param("ip") String ip, Pageable pageable);

    /**
     * Find deletion-related actions
     */
    @Query("SELECT a FROM AuditLog a WHERE a.actionType IN ('DELETE_USER', 'DELETE_CREDIT', 'DELETE_TRANSACTION') ORDER BY a.timestamp DESC")
    Page<AuditLog> findDeletionActions(Pageable pageable);

    /**
     * Statistics: count by action type
     */
    @Query("SELECT NEW map(a.actionType as action, count(a) as count) FROM AuditLog a GROUP BY a.actionType")
    List<java.util.Map<String, Object>> countByActionType();

    /**
     * Statistics: count by severity over period
     */
    @Query("SELECT NEW map(a.severity as severity, count(a) as count) FROM AuditLog a " +
           "WHERE a.timestamp BETWEEN :start AND :end GROUP BY a.severity")
    List<java.util.Map<String, Object>> countBySeverityInRange(@Param("start") Instant start, @Param("end") Instant end);

    /**
     * Count actions for audit trail summary
     */
    long countByActionType(AuditLog.AuditActionType actionType);
    long countByStatus(AuditLog.AuditStatus status);
    long countByStatusAndTimestampBetween(AuditLog.AuditStatus status, Instant startDate, Instant endDate);
    long countBySeverityAndTimestampBetween(AuditLog.AuditSeverity severity, Instant startDate, Instant endDate);
    Optional<AuditLog> findFirstByOrderByTimestampDesc();
    Optional<AuditLog> findFirstByStatusOrderByTimestampDesc(AuditLog.AuditStatus status);
    long countByTimestampAfter(Instant timestamp);
}
