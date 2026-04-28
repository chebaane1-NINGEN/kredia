package com.kredia.service.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kredia.entity.audit.AuditLog;
import com.kredia.repository.audit.AuditLogRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Profile("!test")
@Order(20)
public class AuditLogSeeder implements CommandLineRunner {
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLogSeeder(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (auditLogRepository.count() >= 20) {
            return;
        }

        auditLogRepository.saveAll(buildInitialAuditLogs());
    }

    private List<AuditLog> buildInitialAuditLogs() throws Exception {
        Instant now = Instant.now();
        List<AuditLog> logs = new ArrayList<>();

        logs.add(createLog(1L, "admin@kredia.com", "Admin System", "ADMIN",
                AuditLog.AuditActionType.LOGIN, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.LOW,
                "/api/auth/login", "POST", now.minus(90, ChronoUnit.MINUTES),
                "Successful admin login", null, null,
                createRequestData("User Management"), null, null, 120L));

        logs.add(createLog(1L, "admin@kredia.com", "Admin System", "ADMIN",
                AuditLog.AuditActionType.LOGIN, AuditLog.AuditStatus.FAILED, AuditLog.AuditSeverity.MEDIUM,
                "/api/auth/login", "POST", now.minus(80, ChronoUnit.MINUTES),
                "Failed admin login attempt: invalid password", null, null,
                createRequestData("User Management"), "Invalid credentials", null, 90L));

        logs.add(createLog(2L, "agent01@kredia.com", "Agent One", "AGENT",
                AuditLog.AuditActionType.CREATE_USER, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.MEDIUM,
                "/api/users", "POST", now.minus(70, ChronoUnit.MINUTES),
                "Created new client account", null, null,
                createRequestData("User Management"), null, null, 210L));

        logs.add(createLog(1L, "admin@kredia.com", "Admin System", "ADMIN",
                AuditLog.AuditActionType.UPDATE_USER, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.MEDIUM,
                "/api/users/12/role", "PUT", now.minus(60, ChronoUnit.MINUTES),
                "User role changed from CLIENT to AGENT", createState("role", "CLIENT"), createState("role", "AGENT"),
                createRequestData("User Management"), null, null, 250L));

        logs.add(createLog(3L, "agent02@kredia.com", "Agent Two", "AGENT",
                AuditLog.AuditActionType.VIEW, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.LOW,
                "/api/analytics/dashboard", "GET", now.minus(50, ChronoUnit.MINUTES),
                "Visited analytics dashboard", null, null,
                createRequestData("Analytics"), null, null, 32L));

        logs.add(createLog(1L, "admin@kredia.com", "Admin System", "ADMIN",
                AuditLog.AuditActionType.SYSTEM_CONFIG_CHANGE, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.HIGH,
                "/api/settings", "PUT", now.minus(45, ChronoUnit.MINUTES),
                "System configuration changed: notifications enabled", createState("notificationsEnabled", false), createState("notificationsEnabled", true),
                createRequestData("Settings"), null, null, 560L));

        logs.add(createLog(4L, "agent03@kredia.com", "Agent Three", "AGENT",
                AuditLog.AuditActionType.DELETE_USER, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.HIGH,
                "/api/users/21", "DELETE", now.minus(40, ChronoUnit.MINUTES),
                "Deleted user account #21", null, null,
                createRequestData("User Management"), null, null, 310L));

        logs.add(createLog(2L, "agent01@kredia.com", "Agent One", "AGENT",
                AuditLog.AuditActionType.CREATE_CREDIT, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.MEDIUM,
                "/api/credits", "POST", now.minus(35, ChronoUnit.MINUTES),
                "Created credit request for client #45", null, null,
                createRequestData("Credit Management"), null, null, 220L));

        logs.add(createLog(2L, "agent01@kredia.com", "Agent One", "AGENT",
                AuditLog.AuditActionType.UPDATE_CREDIT, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.MEDIUM,
                "/api/credits/78", "PUT", now.minus(30, ChronoUnit.MINUTES),
                "Credit amount updated from 15000 to 12000", createState("amount", 15000), createState("amount", 12000),
                createRequestData("Credit Management"), null, null, 280L));

        logs.add(createLog(5L, "agent04@kredia.com", "Agent Four", "AGENT",
                AuditLog.AuditActionType.CREATE_TRANSACTION, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.MEDIUM,
                "/api/transactions", "POST", now.minus(28, ChronoUnit.MINUTES),
                "Created payment transaction for client #18", null, null,
                createRequestData("Transaction Management"), null, null, 199L));

        logs.add(createLog(3L, "agent02@kredia.com", "Agent Two", "AGENT",
                AuditLog.AuditActionType.DELETE_TRANSACTION, AuditLog.AuditStatus.FAILED, AuditLog.AuditSeverity.HIGH,
                "/api/transactions/99", "DELETE", now.minus(22, ChronoUnit.MINUTES),
                "Failed transaction deletion due to linked settlement", null, null,
                createRequestData("Transaction Management"), "Cannot delete settled transaction", null, 134L));

        logs.add(createLog(1L, "admin@kredia.com", "Admin System", "ADMIN",
                AuditLog.AuditActionType.RESET_PASSWORD, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.MEDIUM,
                "/api/users/12/reset-password", "POST", now.minus(18, ChronoUnit.MINUTES),
                "Reset password for user #12", null, null,
                createRequestData("User Management"), null, null, 180L));

        logs.add(createLog(6L, "agent05@kredia.com", "Agent Five", "AGENT",
                AuditLog.AuditActionType.VIEW, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.LOW,
                "/api/users/67", "GET", now.minus(15, ChronoUnit.MINUTES),
                "Viewed client profile 67", null, null,
                createRequestData("User Management"), null, null, 40L));

        logs.add(createLog(1L, "admin@kredia.com", "Admin System", "ADMIN",
                AuditLog.AuditActionType.LOGOUT, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.LOW,
                "/api/auth/logout", "POST", now.minus(10, ChronoUnit.MINUTES),
                "Admin logged out successfully", null, null,
                createRequestData("User Management"), null, null, 75L));

        logs.add(createLog(2L, "agent01@kredia.com", "Agent One", "AGENT",
                AuditLog.AuditActionType.VIEW, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.LOW,
                "/api/analytics/report", "GET", now.minus(7, ChronoUnit.MINUTES),
                "Viewed monthly analytics report", null, null,
                createRequestData("Analytics"), null, null, 18L));

        // Older history logs
        logs.add(createLog(1L, "admin@kredia.com", "Admin System", "ADMIN",
                AuditLog.AuditActionType.BLOCK_USER, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.HIGH,
                "/api/users/31/block", "PUT", now.minus(1, ChronoUnit.DAYS),
                "Blocked user 31 for suspicious activity", null, null,
                createRequestData("User Management"), null, null, 410L));

        logs.add(createLog(3L, "agent02@kredia.com", "Agent Two", "AGENT",
                AuditLog.AuditActionType.UPDATE_USER, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.MEDIUM,
                "/api/users/43", "PUT", now.minus(2, ChronoUnit.DAYS),
                "Client address updated", createState("address", "Rue A"), createState("address", "Rue B"),
                createRequestData("User Management"), null, null, 215L));

        logs.add(createLog(4L, "agent03@kredia.com", "Agent Three", "AGENT",
                AuditLog.AuditActionType.GENERATE_REPORT, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.LOW,
                "/api/reports/clients", "GET", now.minus(3, ChronoUnit.DAYS),
                "Generated customer activity report", null, null,
                createRequestData("Analytics"), null, null, 105L));

        logs.add(createLog(1L, "admin@kredia.com", "Admin System", "ADMIN",
                AuditLog.AuditActionType.EXPORT_DATA, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.MEDIUM,
                "/api/data/export", "POST", now.minus(4, ChronoUnit.DAYS),
                "Exported user list to CSV", null, null,
                createRequestData("Settings"), null, null, 320L));

        logs.add(createLog(2L, "agent01@kredia.com", "Agent One", "AGENT",
                AuditLog.AuditActionType.APPROVE_CREDIT, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.MEDIUM,
                "/api/credits/78/approve", "POST", now.minus(5, ChronoUnit.DAYS),
                "Approved credit request #78", null, null,
                createRequestData("Credit Management"), null, null, 165L));

        logs.add(createLog(5L, "agent04@kredia.com", "Agent Four", "AGENT",
                AuditLog.AuditActionType.REJECT_CREDIT, AuditLog.AuditStatus.FAILED, AuditLog.AuditSeverity.HIGH,
                "/api/credits/82/reject", "POST", now.minus(5, ChronoUnit.DAYS),
                "Credit rejection failed because of missing documents", null, null,
                createRequestData("Credit Management"), "Missing approval documents", null, 145L));

        logs.add(createLog(1L, "admin@kredia.com", "Admin System", "ADMIN",
                AuditLog.AuditActionType.CHANGE_PERMISSIONS, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.MEDIUM,
                "/api/users/12/permissions", "PUT", now.minus(6, ChronoUnit.DAYS),
                "Permissions updated", createState("permissions", "READ_ONLY"), createState("permissions", "CUSTOM"),
                createRequestData("User Management"), null, null, 230L));

        logs.add(createLog(2L, "agent01@kredia.com", "Agent One", "AGENT",
                AuditLog.AuditActionType.VIEW, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.LOW,
                "/api/transactions/102", "GET", now.minus(7, ChronoUnit.DAYS),
                "Viewed transaction details", null, null,
                createRequestData("Transaction Management"), null, null, 50L));

        logs.add(createLog(6L, "agent05@kredia.com", "Agent Five", "AGENT",
                AuditLog.AuditActionType.UPDATE_USER, AuditLog.AuditStatus.FAILED, AuditLog.AuditSeverity.MEDIUM,
                "/api/users/67", "PUT", now.minus(7, ChronoUnit.DAYS),
                "Validation error while updating email", createState("email", "old@example.com"), createState("email", "invalid-email"),
                createRequestData("User Management"), "Email format invalid", null, 190L));

        logs.add(createLog(1L, "admin@kredia.com", "Admin System", "ADMIN",
                AuditLog.AuditActionType.IMPORT_DATA, AuditLog.AuditStatus.SUCCESS, AuditLog.AuditSeverity.MEDIUM,
                "/api/data/import", "POST", now.minus(8, ChronoUnit.DAYS),
                "Imported user records from CSV", null, null,
                createRequestData("Settings"), null, null, 780L));

        return logs;
    }

    private AuditLog createLog(Long actorId, String actorEmail, String actorName, String actorRole,
                               AuditLog.AuditActionType actionType,
                               AuditLog.AuditStatus status,
                               AuditLog.AuditSeverity severity,
                               String endpoint,
                               String httpMethod,
                               Instant timestamp,
                               String changesDescription,
                               Map<String, Object> previousState,
                               Map<String, Object> newState,
                               Object requestData,
                               String errorMessage,
                               String correlationId,
                               Long durationMs) throws Exception {
        return createLog(actorId, actorEmail, actorName, actorRole, actionType, status, severity, endpoint, httpMethod,
                timestamp, changesDescription, previousState, newState, requestData, errorMessage, correlationId,
                durationMs, defaultIpAddress(actorId), defaultUserAgent(actorRole), null, null, null);
    }

    private AuditLog createLog(Long actorId, String actorEmail, String actorName, String actorRole,
                               AuditLog.AuditActionType actionType,
                               AuditLog.AuditStatus status,
                               AuditLog.AuditSeverity severity,
                               String endpoint,
                               String httpMethod,
                               Instant timestamp,
                               String changesDescription,
                               Map<String, Object> previousState,
                               Map<String, Object> newState,
                               Object requestData,
                               String errorMessage,
                               String correlationId,
                               Long durationMs,
                               String ipAddress,
                               String userAgent,
                               Long targetId,
                               String targetEmail,
                               String targetType) throws Exception {
        AuditLog.AuditLogBuilder builder = AuditLog.builder()
                .actorId(actorId)
                .actorEmail(actorEmail)
                .actorName(actorName)
                .actorRole(actorRole)
                .actionType(actionType)
                .status(status)
                .severity(severity)
                .endpoint(endpoint)
                .httpMethod(httpMethod)
                .changesDescription(changesDescription)
                .timestamp(timestamp)
                .errorMessage(errorMessage)
                .correlationId(correlationId)
                .durationMs(durationMs)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .targetId(targetId)
                .targetEmail(targetEmail)
                .targetType(targetType)
                .requestData(toJson(requestData));

        if (previousState != null) {
            builder.previousState(toJson(previousState));
        }
        if (newState != null) {
            builder.newState(toJson(newState));
        }

        return builder.build();
    }

    private String defaultIpAddress(Long actorId) {
        if (actorId == null) {
            return "192.168.100.100";
        }
        int suffix = (int) ((actorId % 200) + 1);
        return "192.168.10." + suffix;
    }

    private String defaultUserAgent(String actorRole) {
        if ("ADMIN".equals(actorRole)) {
            return "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/537.36";
        }
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    }

    private Map<String, Object> createRequestData(String moduleName) {
        Map<String, Object> request = new HashMap<>();
        request.put("module", moduleName);
        request.put("metadata", Map.of("source", "audit-seed"));
        return request;
    }

    private Map<String, Object> createState(String key, Object value) {
        Map<String, Object> state = new HashMap<>();
        state.put(key, value);
        return state;
    }

    private String toJson(Object obj) throws Exception {
        if (obj == null) {
            return null;
        }
        return objectMapper.writeValueAsString(obj);
    }
}
