package com.kredia.controller.user;

import com.kredia.dto.ApiResponse;
import com.kredia.dto.user.AdminStatsDTO;
import com.kredia.dto.user.AgentPerformanceDTO;
import com.kredia.dto.user.ClientEligibilityDTO;
import com.kredia.dto.user.ClientRiskScoreDTO;
import com.kredia.dto.user.UserActivityResponseDTO;
import com.kredia.dto.user.ClientProfileUpdateDTO;
import com.kredia.dto.user.AdminUserUpdateDTO;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Optional;

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
    public ResponseEntity<ApiResponse<UserResponseDTO>> create(@Valid @RequestBody UserRequestDTO user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(userService.create(user)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> search(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "status", required = false) UserStatus status,
            @RequestParam(name = "role", required = false) UserRole role,
            @RequestParam(name = "createdFrom", required = false) Instant createdFrom,
            @RequestParam(name = "createdTo", required = false) Instant createdTo,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                userService.search(
                        actorId,
                        Optional.ofNullable(email),
                        Optional.ofNullable(status),
                        Optional.ofNullable(role),
                        Optional.ofNullable(createdFrom),
                        Optional.ofNullable(createdTo),
                        pageable
                )
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getById(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("id") Long id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getById(actorId, id)));
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

    @GetMapping("/admin/stats")
    public ResponseEntity<ApiResponse<AdminStatsDTO>> adminStats(
            @RequestHeader("X-Actor-Id") Long actorId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminStats(actorId)));
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

    @GetMapping("/admin/audit/{userId}")
    public ResponseEntity<ApiResponse<Page<UserActivityResponseDTO>>> adminAudit(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("userId") Long userId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminAudit(actorId, userId, pageable)));
    }

    @GetMapping("/admin/activities")
    public ResponseEntity<ApiResponse<Page<UserActivityResponseDTO>>> adminActivityByRole(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam(name = "role", required = false) UserRole role,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminActivityByRole(actorId, Optional.ofNullable(role), pageable)));
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

    @GetMapping("/client/{clientId}/profile")
    public ResponseEntity<ApiResponse<UserResponseDTO>> clientProfile(@PathVariable("clientId") Long clientId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.clientProfile(clientId)));
    }

    @GetMapping("/client/{clientId}/activity")
    public ResponseEntity<ApiResponse<Page<UserActivityResponseDTO>>> clientActivity(
            @PathVariable("clientId") Long clientId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.clientActivity(clientId, pageable)));
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
}
