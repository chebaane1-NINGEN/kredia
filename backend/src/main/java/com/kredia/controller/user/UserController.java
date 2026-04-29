package com.kredia.controller.user;

import com.kredia.dto.ApiResponse;
import com.kredia.dto.user.AdminStatsDTO;
import com.kredia.dto.user.AgentPerformanceDTO;
import com.kredia.dto.user.ClientDetailsDTO;
import com.kredia.dto.user.ClientEligibilityDTO;
import com.kredia.dto.user.ClientRiskScoreDTO;
import com.kredia.dto.user.UserActivityResponseDTO;
import com.kredia.dto.user.ClientProfileUpdateDTO;
import com.kredia.dto.user.AdminUserUpdateDTO;
import com.kredia.dto.user.UserResponseDTO;
import com.kredia.dto.user.UserRequestDTO;
import com.kredia.dto.user.UserResponseDTO;
import com.kredia.dto.user.UserRoleChangeRequestDTO;
import com.kredia.entity.user.KycDocument;
import com.kredia.enums.DocumentType;
import com.kredia.enums.KycStatus;
import com.kredia.service.user.KycDocumentService;
import com.kredia.service.user.UserService;
import com.kredia.entity.user.UserRole;
import com.kredia.entity.user.UserStatus;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final KycDocumentService kycDocumentService;

    public UserController(UserService userService, KycDocumentService kycDocumentService) {
        this.userService = userService;
        this.kycDocumentService = kycDocumentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponseDTO>> create(
            @RequestHeader("X-Actor-Id") Long actorId,
            @Valid @RequestBody UserRequestDTO user
    ) {
        try {
            if (user.getEmail() == null || user.getEmail().isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
            }
            if (user.getFirstName() == null || user.getFirstName().isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("First name is required"));
            }
            if (user.getLastName() == null || user.getLastName().isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Last name is required"));
            }
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Password is required"));
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(userService.create(actorId, user)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("User creation failed: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> search(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "status", required = false) List<UserStatus> status,
            @RequestParam(name = "role", required = false) List<UserRole> role,
            @RequestParam(name = "createdFrom", required = false) String createdFrom,
            @RequestParam(name = "createdTo", required = false) String createdTo,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                userService.search(
                        actorId,
                        Optional.ofNullable(email),
                        Optional.ofNullable(status),
                        Optional.ofNullable(role),
                        parseStartOfDay(createdFrom),
                        parseEndOfDay(createdTo),
                        pageable
                )
        ));
    }

    private Optional<Instant> parseStartOfDay(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            if (value.contains("T")) {
                return Optional.of(Instant.parse(value));
            }
            LocalDate date = LocalDate.parse(value);
            return Optional.of(date.atStartOfDay(ZoneOffset.UTC).toInstant());
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private Optional<Instant> parseEndOfDay(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            if (value.contains("T")) {
                return Optional.of(Instant.parse(value));
            }
            LocalDate date = LocalDate.parse(value);
            return Optional.of(date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusNanos(1));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getById(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getById(actorId, id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponseDTO>> update(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id,
            @Valid @RequestBody UserRequestDTO payload
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.update(actorId, id, payload)));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateProfile(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id,
            @Valid @RequestBody ClientProfileUpdateDTO payload
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.updateProfile(actorId, id, payload)));
    }

    @PutMapping("/{id}/admin")
    public ResponseEntity<ApiResponse<UserResponseDTO>> adminUpdateUser(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminUserUpdateDTO payload
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminUpdateUser(actorId, id, payload)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id
    ) {
        userService.delete(actorId, id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<UserResponseDTO>> restore(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.restore(actorId, id)));
    }

    @PatchMapping("/{id}/block")
    public ResponseEntity<ApiResponse<UserResponseDTO>> block(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.block(actorId, id)));
    }

    @PatchMapping("/{id}/suspend")
    public ResponseEntity<ApiResponse<UserResponseDTO>> suspend(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.suspend(actorId, id)));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<UserResponseDTO>> activate(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.activate(actorId, id)));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<UserResponseDTO>> deactivate(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.deactivate(actorId, id)));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponseDTO>> changeRole(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id,
            @Valid @RequestBody UserRoleChangeRequestDTO request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.changeRole(actorId, id, request.getRole())));
    }

    @PostMapping("/admin/assign")
    public ResponseEntity<ApiResponse<UserResponseDTO>> assignClient(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam Long agentId,
            @RequestParam Long clientId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.assignClientToAgent(actorId, agentId, clientId)));
    }

    @DeleteMapping("/admin/assign")
    public ResponseEntity<ApiResponse<UserResponseDTO>> unassignClient(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam Long clientId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.unassignClient(actorId, clientId)));
    }

    @DeleteMapping("/admin/bulk-delete")
    public ResponseEntity<ApiResponse<Void>> bulkDelete(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestBody List<Long> ids
    ) {
        userService.bulkDelete(actorId, ids);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/admin/bulk-status")
    public ResponseEntity<ApiResponse<Void>> bulkUpdateStatus(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam UserStatus status,
            @RequestBody List<Long> ids
    ) {
        userService.bulkUpdateStatus(actorId, ids, status);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<ApiResponse<AdminStatsDTO>> adminStats(
            @RequestHeader("X-Actor-Id") Long actorId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminStats(actorId)));
    }

    @GetMapping("/admin/export/csv")
    public ResponseEntity<byte[]> exportUsersCsv(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "status", required = false) List<UserStatus> status,
            @RequestParam(name = "role", required = false) List<UserRole> role,
            @RequestParam(name = "createdFrom", required = false) String createdFrom,
            @RequestParam(name = "createdTo", required = false) String createdTo
    ) {
        byte[] data = userService.exportUsersCsv(actorId, Optional.ofNullable(email), Optional.ofNullable(status), Optional.ofNullable(role), parseStartOfDay(createdFrom), parseEndOfDay(createdTo));
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=users_" + Instant.now().toString().replaceAll(":", "-") + ".csv")
                .header("Content-Type", "text/csv; charset=UTF-8")
                .body(data);
    }

    @GetMapping("/admin/export/excel")
    public ResponseEntity<byte[]> exportUsersExcel(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "status", required = false) List<UserStatus> status,
            @RequestParam(name = "role", required = false) List<UserRole> role,
            @RequestParam(name = "createdFrom", required = false) String createdFrom,
            @RequestParam(name = "createdTo", required = false) String createdTo
    ) {
        byte[] data = userService.exportUsersExcel(actorId, Optional.ofNullable(email), Optional.ofNullable(status), Optional.ofNullable(role), parseStartOfDay(createdFrom), parseEndOfDay(createdTo));
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=users_" + Instant.now().toString().replaceAll(":", "-") + ".xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(data);
    }

    @PostMapping("/admin/export/csv/selected")
    public ResponseEntity<byte[]> exportSelectedUsersCsv(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestBody List<Long> userIds
    ) {
        byte[] data = userService.exportSelectedUsersCsv(actorId, userIds);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=selected_users_" + Instant.now().toString().replaceAll(":", "-") + ".csv")
                .header("Content-Type", "text/csv; charset=UTF-8")
                .body(data);
    }

    @PostMapping("/admin/export/excel/selected")
    public ResponseEntity<byte[]> exportSelectedUsersExcel(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestBody List<Long> userIds
    ) {
        byte[] data = userService.exportSelectedUsersExcel(actorId, userIds);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=selected_users_" + Instant.now().toString().replaceAll(":", "-") + ".xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(data);
    }

    @GetMapping("/admin/agents")
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> adminAgent(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminAgent(actorId, pageable)));
    }

    @GetMapping("/admin/clients")
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> adminClient(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminClient(actorId, pageable)));
    }

    @GetMapping("/agent/clients")
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> agentClients(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "status", required = false) UserStatus status,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.agentClients(actorId, Optional.ofNullable(email), Optional.ofNullable(status), pageable)));
    }

    @GetMapping("/agent/clients/enhanced")
    public ResponseEntity<ApiResponse<Page<com.kredia.dto.user.EnhancedClientDTO>>> agentClientsEnhanced(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "statuses", required = false) String statusesStr,
            @RequestParam(name = "priorities", required = false) String prioritiesStr,
            @RequestParam(name = "startDate", required = false) String startDate,
            @RequestParam(name = "endDate", required = false) String endDate,
            @PageableDefault Pageable pageable
    ) {
        // Parse comma-separated strings into lists
        List<UserStatus> statuses = null;
        if (statusesStr != null && !statusesStr.trim().isEmpty()) {
            statuses = Arrays.stream(statusesStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(s -> {
                        try {
                            return UserStatus.valueOf(s.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            throw new IllegalArgumentException("Invalid status: " + s);
                        }
                    })
                    .collect(Collectors.toList());
        }

        List<String> priorities = null;
        if (prioritiesStr != null && !prioritiesStr.trim().isEmpty()) {
            priorities = Arrays.stream(prioritiesStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(ApiResponse.ok(userService.agentClientsEnhanced(actorId, Optional.ofNullable(email), Optional.ofNullable(statuses), Optional.ofNullable(priorities), parseStartOfDay(startDate), parseEndOfDay(endDate), pageable)));
    }

    @GetMapping("/admin/activities")
    public ResponseEntity<ApiResponse<Page<UserActivityResponseDTO>>> adminActivities(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam(name = "role", required = false) UserRole role,
            @RequestParam(name = "actionType", required = false) String actionType,
            @RequestParam(name = "userId", required = false) Long userId,
            @RequestParam(name = "from", required = false) String from,
            @RequestParam(name = "to", required = false) String to,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminActivities(
                actorId,
                Optional.ofNullable(role),
                Optional.ofNullable(actionType),
                Optional.ofNullable(userId),
                parseStartOfDay(from),
                parseEndOfDay(to),
                pageable
        )));
    }

    @GetMapping("/admin/audit/{userId}")
    public ResponseEntity<ApiResponse<Page<UserActivityResponseDTO>>> adminAudit(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("userId") Long userId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminAudit(actorId, userId, pageable)));
    }

    @GetMapping("/agent/{agentId}/dashboard")
    public ResponseEntity<ApiResponse<AgentPerformanceDTO>> agentDashboard(@PathVariable("agentId") Long agentId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.agentDashboard(agentId)));
    }

    @GetMapping("/agent/{agentId}/performance")
    public ResponseEntity<ApiResponse<AgentPerformanceDTO>> agentPerformance(@PathVariable("agentId") Long agentId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.agentPerformance(agentId)));
    }

    @GetMapping("/agent/{agentId}/activity")
    public ResponseEntity<ApiResponse<Page<UserActivityResponseDTO>>> agentActivity(
            @PathVariable("agentId") Long agentId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.agentActivity(agentId, pageable)));
    }

    @GetMapping("/agent/{agentId}/activity/clients")
    public ResponseEntity<ApiResponse<Page<UserActivityResponseDTO>>> agentActivityForClients(
            @PathVariable("agentId") Long agentId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.agentActivityForClients(agentId, pageable)));
    }

    @GetMapping("/client/{clientId}/profile")
    public ResponseEntity<ApiResponse<UserResponseDTO>> clientProfile(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("clientId") Long clientId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.clientProfile(actorId, clientId)));
    }

    @GetMapping("/agent/client/{clientId}")
    public ResponseEntity<ApiResponse<ClientDetailsDTO>> agentClientDetails(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("clientId") Long clientId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.agentClientDetails(actorId, clientId)));
    }

    @GetMapping("/client/{clientId}/activity")
    public ResponseEntity<ApiResponse<Page<UserActivityResponseDTO>>> clientActivity(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("clientId") Long clientId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.clientActivity(actorId, clientId, pageable)));
    }

    @GetMapping("/client/{clientId}/risk-score")
    public ResponseEntity<ApiResponse<ClientRiskScoreDTO>> clientRiskScore(@PathVariable("clientId") Long clientId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.clientRiskScore(clientId)));
    }

    @GetMapping("/client/{clientId}/eligibility")
    public ResponseEntity<ApiResponse<ClientEligibilityDTO>> clientEligibility(@PathVariable("clientId") Long clientId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.clientEligibility(clientId)));
    }

    @PostMapping("/kyc/upload")
    public ResponseEntity<ApiResponse<KycDocument>> uploadKycDocument(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") DocumentType type
    ) {
        return ResponseEntity.ok(ApiResponse.ok(kycDocumentService.uploadDocument(actorId, file, type)));
    }

    @PatchMapping("/kyc/{docId}/verify")
    public ResponseEntity<ApiResponse<KycDocument>> verifyKycDocument(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("docId") Long docId,
            @RequestParam("status") KycStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.ok(kycDocumentService.verifyDocument(actorId, docId, status)));
    }

    // Agent client approval/rejection workflow
    @PostMapping("/agent/client/{clientId}/approve")
    public ResponseEntity<ApiResponse<UserResponseDTO>> approveClient(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("clientId") Long clientId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.approveClient(actorId, clientId)));
    }

    @PostMapping("/agent/client/{clientId}/reject")
    public ResponseEntity<ApiResponse<UserResponseDTO>> rejectClient(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("clientId") Long clientId,
            @RequestBody Map<String, String> request
    ) {
        String reason = request.get("reason");
        return ResponseEntity.ok(ApiResponse.ok(userService.rejectClient(actorId, clientId, reason)));
    }

    @PostMapping("/agent/client/{clientId}/suspend")
    public ResponseEntity<ApiResponse<UserResponseDTO>> suspendClient(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("clientId") Long clientId,
            @RequestBody Map<String, String> request
    ) {
        String reason = request.get("reason");
        return ResponseEntity.ok(ApiResponse.ok(userService.suspendClient(actorId, clientId, reason)));
    }
}
