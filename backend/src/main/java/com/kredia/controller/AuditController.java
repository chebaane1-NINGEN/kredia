package com.kredia.controller;

import com.kredia.dto.ApiResponse;
import com.kredia.dto.audit.AuditLogDTO;
import com.kredia.dto.audit.AuditLogFilter;
import com.kredia.dto.audit.AuditLogSummary;
import com.kredia.service.audit.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneOffset;

/**
 * AuditController: REST API for audit trail system
 *
 * Endpoints:
 * GET /api/audit/logs - Paginated audit logs with filters
 * GET /api/audit/logs/{id} - Detailed view of a single audit log
 * GET /api/audit/summary - Dashboard summary
 * GET /api/audit/summary/high-severity - High-severity actions
 * GET /api/audit/summary/failures - Failed actions
 * GET /api/audit/actor/{actorId} - Logs by specific actor
 * GET /api/audit/target/{targetId} - Logs affecting specific target
 */
@RestController
@RequestMapping("/api/audit")
public class AuditController {
    private static final Logger logger = LoggerFactory.getLogger(AuditController.class);
    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    // ==================== MAIN AUDIT LOG ENDPOINTS ====================

    /**
     * GET /api/audit/logs?page=0&pageSize=20&startDate=...&actionType=CREATE_USER&severity=HIGH
     * Retrieve paginated audit logs with advanced filtering
     */
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) Long targetId,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        try {
            AuditLogFilter filter = AuditLogFilter.builder()
                    .startDate(parseDateParameter(startDate, false))
                    .endDate(parseDateParameter(endDate, true))
                    .actionType(actionType)
                    .severity(severity)
                    .status(status)
                    .actorId(actorId)
                    .targetId(targetId)
                    .ipAddress(ipAddress)
                    .page(page)
                    .pageSize(pageSize)
                    .sortBy(sortBy)
                    .sortDirection(sortDirection)
                    .build();

            Page<AuditLogDTO> logs = auditService.searchAuditLogs(filter);
            return ResponseEntity.ok(ApiResponse.ok(logs));
        } catch (Exception e) {
            logger.error("Error retrieving audit logs", e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to retrieve audit logs"));
        }
    }

    private Instant parseDateParameter(String value, boolean endOfDay) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Instant.parse(value);
        } catch (Exception ignored) {
        }

        try {
            LocalDate localDate = LocalDate.parse(value);
            if (endOfDay) {
                return localDate.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant();
            }
            return localDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        } catch (Exception e) {
            logger.warn("Unable to parse date parameter {}", value);
            return null;
        }
    }

    /**
     * GET /api/audit/logs/{id}
     * Get detailed view of a single audit log (for modal/preview)
     */
    @GetMapping("/logs/{id}")
    public ResponseEntity<ApiResponse<AuditLogDTO>> getAuditLogById(@PathVariable Long id) {
        try {
            AuditLogDTO auditLog = auditService.getAuditLogById(id);
            if (auditLog == null) {
                return ResponseEntity.status(404).body(ApiResponse.error("Audit log not found"));
            }
            return ResponseEntity.ok(ApiResponse.ok(auditLog));
        } catch (Exception e) {
            logger.error("Error retrieving audit log {}", id, e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to retrieve audit log"));
        }
    }

    // ==================== DASHBOARD SUMMARY ====================

    /**
     * GET /api/audit/summary
     * Get overview of audit activity (for admin dashboard)
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AuditLogSummary>> getAuditSummary() {
        try {
            AuditLogSummary summary = auditService.getAuditSummary();
            return ResponseEntity.ok(ApiResponse.ok(summary));
        } catch (Exception e) {
            logger.error("Error retrieving audit summary", e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to retrieve audit summary"));
        }
    }

    /**
     * GET /api/audit/summary/high-severity?page=0&pageSize=10
     * Get recent high-severity actions for security monitoring
     */
    @GetMapping("/summary/high-severity")
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getHighSeverityActions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        try {
            Page<AuditLogDTO> actions = auditService.getHighSeverityActions(page, pageSize);
            return ResponseEntity.ok(ApiResponse.ok(actions));
        } catch (Exception e) {
            logger.error("Error retrieving high-severity actions", e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to retrieve high-severity actions"));
        }
    }

    /**
     * GET /api/audit/summary/failures?page=0&pageSize=10
     * Get failed actions for incident investigation
     */
    @GetMapping("/summary/failures")
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getFailedActions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        try {
            Page<AuditLogDTO> actions = auditService.getFailedActions(page, pageSize);
            return ResponseEntity.ok(ApiResponse.ok(actions));
        } catch (Exception e) {
            logger.error("Error retrieving failed actions", e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to retrieve failed actions"));
        }
    }

    // ==================== ACTOR & TARGET FILTERING ====================

    /**
     * GET /api/audit/actor/{actorId}?page=0&pageSize=20
     * Get all actions performed by a specific user (actor)
     */
    @GetMapping("/actor/{actorId}")
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getAuditLogsByActor(
            @PathVariable Long actorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        try {
            Page<AuditLogDTO> logs = auditService.getAuditLogsByActor(actorId, page, pageSize);
            return ResponseEntity.ok(ApiResponse.ok(logs));
        } catch (Exception e) {
            logger.error("Error retrieving audit logs for actor {}", actorId, e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to retrieve logs for actor"));
        }
    }

    /**
     * GET /api/audit/target/{targetId}?page=0&pageSize=20
     * Get all actions that affected a specific target (user/resource)
     */
    @GetMapping("/target/{targetId}")
    public ResponseEntity<ApiResponse<Page<AuditLogDTO>>> getAuditLogsByTarget(
            @PathVariable Long targetId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        try {
            Page<AuditLogDTO> logs = auditService.getAuditLogsByTarget(targetId, page, pageSize);
            return ResponseEntity.ok(ApiResponse.ok(logs));
        } catch (Exception e) {
            logger.error("Error retrieving audit logs for target {}", targetId, e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to retrieve logs for target"));
        }
    }

    // ==================== LOG ACTION ENDPOINT ====================

    /**
     * POST /api/audit/log
     * Log a new audit action (used by frontend interceptor)
     */
    @PostMapping("/log")
    public ResponseEntity<ApiResponse<AuditLogDTO>> logAction(@RequestBody AuditLogDTO auditLogDTO) {
        try {
            AuditLogDTO loggedAction = auditService.logAction(auditLogDTO);
            return ResponseEntity.ok(ApiResponse.ok(loggedAction));
        } catch (Exception e) {
            logger.error("Error logging audit action", e);
            return ResponseEntity.status(500).body(ApiResponse.error("Failed to log audit action"));
        }
    }

    // ==================== HEALTH CHECK ====================

    /**
     * GET /api/audit/health
     * Check audit system health
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.ok("Audit service is operational"));
    }
}
