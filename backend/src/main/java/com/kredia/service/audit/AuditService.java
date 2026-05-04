package com.kredia.service.audit;

import com.kredia.dto.audit.AuditLogDTO;
import com.kredia.dto.audit.AuditLogFilter;
import com.kredia.dto.audit.AuditLogSummary;
import com.kredia.entity.audit.AuditLog;
import com.kredia.repository.audit.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * AuditService: Handles all audit trail operations
 * - Logging actions
 * - Querying with filters
 * - Generating reports
 */
@Service
@Transactional
public class AuditService {
    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    // ==================== LOGGING ======================  

    /**
     * Log an action (called by Interceptors or AOP)
     */
    public AuditLog logAction(Long actorId, String actorEmail, String actorName, String actorRole,
                              AuditLog.AuditActionType actionType,
                              String endpoint, String httpMethod,
                              Object requestData, Object responseData,
                              String ipAddress, String userAgent,
                              Long targetId, String targetEmail, String targetType) {
        try {
            AuditLog auditLog = AuditLog.builder()
                .actorId(actorId)
                .actorEmail(actorEmail)
                .actorName(actorName)
                .actorRole(actorRole)
                .actionType(actionType)
                .status(AuditLog.AuditStatus.SUCCESS)
                .endpoint(endpoint)
                .httpMethod(httpMethod)
                .requestData(toJson(requestData))
                .responseData(toJson(responseData))
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .targetId(targetId)
                .targetEmail(targetEmail)
                .targetType(targetType)
                .timestamp(Instant.now())
                .build();

            return auditLogRepository.save(auditLog);
        } catch (Exception e) {
            logger.error("Error logging audit action", e);
            return null;
        }
    }

    /**
     * Log a failed action
     */
    public AuditLog logFailedAction(Long actorId, String actorEmail, String actorName, String actorRole,
                                     AuditLog.AuditActionType actionType,
                                     String endpoint, String httpMethod,
                                     String errorMessage, String ipAddress, String userAgent) {
        try {
            AuditLog auditLog = AuditLog.builder()
                .actorId(actorId)
                .actorEmail(actorEmail)
                .actorName(actorName)
                .actorRole(actorRole)
                .actionType(actionType)
                .status(AuditLog.AuditStatus.FAILED)
                .endpoint(endpoint)
                .httpMethod(httpMethod)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .errorMessage(errorMessage)
                .timestamp(Instant.now())
                .build();

            return auditLogRepository.save(auditLog);
        } catch (Exception e) {
            logger.error("Error logging failed audit action", e);
            return null;
        }
    }

    /**
     * Log an UPDATE action with before/after state
     */
    public AuditLog logUpdateAction(Long actorId, String actorEmail, String actorName, String actorRole,
                                    Long targetId, String targetEmail, String targetType,
                                    Object previousState, Object newState,
                                    String endpoint, String ipAddress, String userAgent) {
        try {
            AuditLog auditLog = AuditLog.builder()
                .actorId(actorId)
                .actorEmail(actorEmail)
                .actorName(actorName)
                .actorRole(actorRole)
                .actionType(AuditLog.AuditActionType.UPDATE_USER) // Or appropriate type
                .status(AuditLog.AuditStatus.SUCCESS)
                .targetId(targetId)
                .targetEmail(targetEmail)
                .targetType(targetType)
                .previousState(toJson(previousState))
                .newState(toJson(newState))
                .changesDescription(generateChangesSummary(previousState, newState))
                .endpoint(endpoint)
                .httpMethod("PUT")
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .timestamp(Instant.now())
                .build();

            return auditLogRepository.save(auditLog);
        } catch (Exception e) {
            logger.error("Error logging update audit action", e);
            return null;
        }
    }

    /**
     * Log an action from DTO (used by REST API)
     */
    public AuditLogDTO logAction(AuditLogDTO auditLogDTO) {
        try {
            AuditLog auditLog = AuditLog.builder()
                .actorId(auditLogDTO.getActorId())
                .actorEmail(auditLogDTO.getActorEmail())
                .actorName(auditLogDTO.getActorName())
                .actorRole(auditLogDTO.getActorRole())
                .actionType(AuditLog.AuditActionType.valueOf(auditLogDTO.getActionType()))
                .status(AuditLog.AuditStatus.valueOf(auditLogDTO.getStatus()))
                .severity(AuditLog.AuditSeverity.valueOf(auditLogDTO.getSeverity()))
                .targetId(auditLogDTO.getTargetId())
                .targetEmail(auditLogDTO.getTargetEmail())
                .targetType(auditLogDTO.getTargetType())
                .endpoint(auditLogDTO.getEndpoint())
                .httpMethod(auditLogDTO.getHttpMethod())
                .requestData(toJson(auditLogDTO.getRequestData()))
                .responseData(toJson(auditLogDTO.getResponseData()))
                .previousState(toJson(auditLogDTO.getPreviousState()))
                .newState(toJson(auditLogDTO.getNewState()))
                .changesDescription(auditLogDTO.getChangesDescription())
                .errorMessage(auditLogDTO.getErrorMessage())
                .ipAddress(auditLogDTO.getIpAddress())
                .userAgent(auditLogDTO.getUserAgent())
                .durationMs(auditLogDTO.getDurationMs())
                .correlationId(auditLogDTO.getCorrelationId())
                .timestamp(Instant.now())
                .build();

            AuditLog savedLog = auditLogRepository.save(auditLog);
            return convertToDTO(savedLog);
        } catch (Exception e) {
            logger.error("Error logging audit action from DTO", e);
            throw new RuntimeException("Failed to log audit action", e);
        }
    }

    // ==================== QUERYING =======================

    /**
     * Get all audit logs with pagination
     */
    public Page<AuditLogDTO> getAllAuditLogs(int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "timestamp"));
        return auditLogRepository.findAll(pageable).map(AuditLogDTO::fromEntity);
    }

    /**
     * Search with complex filters
     */
    public Page<AuditLogDTO> searchAuditLogs(AuditLogFilter filter) {
        Pageable pageable = PageRequest.of(
            filter.getPage(),
            filter.getPageSize(),
            Sort.Direction.fromString(filter.getSortDirection()),
            filter.getSortBy()
        );

        // Default range: last 7 days if not specified
        Instant startDate = filter.getStartDate() != null ? filter.getStartDate() : 
                           Instant.now().minus(7, ChronoUnit.DAYS);
        Instant endDate = filter.getEndDate() != null ? filter.getEndDate() : Instant.now();

        // Parse action types if comma-separated
        AuditLog.AuditActionType actionType = null;
        if (StringUtils.hasText(filter.getActionType())) {
            try {
                actionType = AuditLog.AuditActionType.valueOf(filter.getActionType());
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid action type: {}", filter.getActionType());
            }
        }

        // Parse severity
        AuditLog.AuditSeverity severity = null;
        if (StringUtils.hasText(filter.getSeverity())) {
            try {
                severity = AuditLog.AuditSeverity.valueOf(filter.getSeverity());
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid severity: {}", filter.getSeverity());
            }
        }

        // Parse status
        AuditLog.AuditStatus status = null;
        if (StringUtils.hasText(filter.getStatus())) {
            try {
                status = AuditLog.AuditStatus.valueOf(filter.getStatus());
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid status: {}", filter.getStatus());
            }
        }

        String ipAddress = StringUtils.hasText(filter.getIpAddress()) ? filter.getIpAddress().trim() : null;

        return auditLogRepository.findByMultipleCriteria(startDate, endDate, actionType, severity, status,
                filter.getActorId(), filter.getTargetId(), ipAddress, pageable)
            .map(AuditLogDTO::fromEntity);
    }

    /**
     * Get single audit log by ID
     */
    public AuditLogDTO getAuditLogById(Long id) {
        return auditLogRepository.findById(id)
            .map(AuditLogDTO::fromEntity)
            .orElse(null);
    }

    /**
     * Get audit logs by actor
     */
    public Page<AuditLogDTO> getAuditLogsByActor(Long actorId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "timestamp"));
        return auditLogRepository.findByActorId(actorId, pageable).map(AuditLogDTO::fromEntity);
    }

    /**
     * Get audit logs by target (user affected)
     */
    public Page<AuditLogDTO> getAuditLogsByTarget(Long targetId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "timestamp"));
        return auditLogRepository.findByTargetId(targetId, pageable).map(AuditLogDTO::fromEntity);
    }

    // ==================== REPORTING ======================

    /**
     * Get dashboard summary of audit activity
     */
    public AuditLogSummary getAuditSummary() {
        // Use last 30 days for meaningful metrics (seeded data may be older)
        Instant last30Days = Instant.now().minus(30, ChronoUnit.DAYS);
        Instant now = Instant.now();

        long totalToday = auditLogRepository.countByTimestampAfter(last30Days);
        long failedToday = auditLogRepository.countByStatusAndTimestampBetween(AuditLog.AuditStatus.FAILED, last30Days, now);
        long highSeverityToday = auditLogRepository.countBySeverityAndTimestampBetween(AuditLog.AuditSeverity.HIGH, last30Days, now);

        List<java.util.Map<String, Object>> actionDist = auditLogRepository.countByActionTypeInRange(last30Days, now);
        List<java.util.Map<String, Object>> severityDist = auditLogRepository.countBySeverityInRange(last30Days, now);

        Map<String, Long> actionMap = actionDist.stream()
            .collect(Collectors.toMap(m -> m.get("action").toString(), m -> ((Number)m.get("count")).longValue()));
        Map<String, Long> severityMap = severityDist.stream()
            .collect(Collectors.toMap(m -> m.get("severity").toString(), m -> ((Number)m.get("count")).longValue()));

        AuditLogDTO mostRecentAction = auditLogRepository.findFirstByOrderByTimestampDesc()
            .map(AuditLogDTO::fromEntity)
            .orElse(null);
        AuditLogDTO mostRecentFailure = auditLogRepository.findFirstByStatusOrderByTimestampDesc(AuditLog.AuditStatus.FAILED)
            .map(AuditLogDTO::fromEntity)
            .orElse(null);

        return AuditLogSummary.builder()
            .totalActionsToday(totalToday)
            .failedActionsToday(failedToday)
            .highSeverityActionsToday(highSeverityToday)
            .actionTypeDistribution(actionMap)
            .severityDistribution(severityMap)
            .mostRecentAction(mostRecentAction)
            .mostRecentFailure(mostRecentFailure)
            .build();
    }

    /**
     * Get high-severity actions for security dashboard
     */
    public Page<AuditLogDTO> getHighSeverityActions(int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "timestamp"));
        return auditLogRepository.findHighSeverityActions(pageable).map(AuditLogDTO::fromEntity);
    }

    /**
     * Get failed actions for incident investigation
     */
    public Page<AuditLogDTO> getFailedActions(int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "timestamp"));
        return auditLogRepository.findFailedActions(pageable).map(AuditLogDTO::fromEntity);
    }

    // ==================== HELPERS ======================

    /**
     * Convert object to JSON string
     */
    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            logger.error("Error serializing to JSON", e);
            return obj.toString();
        }
    }

    /**
     * Generate human-readable changes summary
     */
    private String generateChangesSummary(Object before, Object after) {
        if (before == null || after == null) return "Unknown changes";
        
        try {
            Map<String, Object> beforeMap = objectMapper.convertValue(before, Map.class);
            Map<String, Object> afterMap = objectMapper.convertValue(after, Map.class);

            StringBuilder sb = new StringBuilder();
            for (String key : afterMap.keySet()) {
                Object beforeVal = beforeMap.get(key);
                Object afterVal = afterMap.get(key);
                
                if (!java.util.Objects.equals(beforeVal, afterVal)) {
                    sb.append(key).append(": ");
                    sb.append(beforeVal).append(" → ");
                    sb.append(afterVal).append("; ");
                }
            }
            return sb.toString().isEmpty() ? "No changes detected" : sb.toString();
        } catch (Exception e) {
            return "Unable to generate summary";
        }
    }

    // ==================== CONVERSION METHODS =======================

    /**
     * Convert AuditLog entity to AuditLogDTO
     */
    private AuditLogDTO convertToDTO(AuditLog auditLog) {
        return AuditLogDTO.fromEntity(auditLog);
    }
}
