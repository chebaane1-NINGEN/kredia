package com.kredia.controller;

import com.kredia.dto.ApiResponse;
import com.kredia.dto.AdminStatsDTO;
import com.kredia.dto.AgentPerformanceDTO;
import com.kredia.dto.ClientEligibilityDTO;
import com.kredia.dto.ClientRiskScoreDTO;
import com.kredia.dto.UserActivityResponseDTO;
import com.kredia.dto.UserRequestDTO;
import com.kredia.dto.UserResponseDTO;
import com.kredia.dto.UserRoleChangeRequestDTO;
import com.kredia.service.UserService;
import com.kredia.enums.UserRole;
import com.kredia.enums.UserStatus;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponseDTO>> create(@Valid @RequestBody UserRequestDTO user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(userService.create(user)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> search(
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "status", required = false) UserStatus status,
            @RequestParam(name = "role", required = false) UserRole role,
            @RequestParam(name = "createdFrom", required = false) Instant createdFrom,
            @RequestParam(name = "createdTo", required = false) Instant createdTo,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                userService.search(
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
    public ResponseEntity<ApiResponse<UserResponseDTO>> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponseDTO>> update(@PathVariable("id") Long id, @Valid @RequestBody UserRequestDTO user) {
        return ResponseEntity.ok(ApiResponse.ok(userService.update(id, user)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") Long id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<UserResponseDTO>> restore(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.restore(id)));
    }

    @PatchMapping("/{id}/block")
    public ResponseEntity<ApiResponse<UserResponseDTO>> block(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.block(id)));
    }

    @PatchMapping("/{id}/suspend")
    public ResponseEntity<ApiResponse<UserResponseDTO>> suspend(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.suspend(id)));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<UserResponseDTO>> activate(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.activate(id)));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<UserResponseDTO>> deactivate(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.deactivate(id)));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponseDTO>> changeRole(
            @PathVariable("id") Long id,
            @Valid @RequestBody UserRoleChangeRequestDTO request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.changeRole(id, request.getRole())));
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<ApiResponse<AdminStatsDTO>> adminStats(
            @RequestHeader("X-Actor-Id") Long actorId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminStats(actorId)));
    }

    @GetMapping("/admin/agents")
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> adminAgents(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminAgents(actorId, pageable)));
    }

    @GetMapping("/admin/clients")
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> adminClients(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminClients(actorId, pageable)));
    }

    @GetMapping("/admin/audit/{userId}")
    public ResponseEntity<ApiResponse<List<UserActivityResponseDTO>>> adminAudit(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable("userId") Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminAudit(actorId, userId)));
    }

    @GetMapping("/admin/activities")
    public ResponseEntity<ApiResponse<List<UserActivityResponseDTO>>> adminActivitiesByRole(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam(name = "role") UserRole role,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminActivitiesByRole(actorId, role, pageable)));
    }

    @GetMapping("/agent/{agentId}/dashboard")
    public ResponseEntity<ApiResponse<AgentPerformanceDTO>> agentDashboard(@PathVariable("agentId") Long agentId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.agentDashboard(agentId)));
    }

    @GetMapping("/agent/{agentId}/performance")
    public ResponseEntity<ApiResponse<AgentPerformanceDTO>> agentPerformance(@PathVariable("agentId") Long agentId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.agentPerformance(agentId)));
    }

    @GetMapping("/agent/{agentId}/activities")
    public ResponseEntity<ApiResponse<List<UserActivityResponseDTO>>> agentActivities(@PathVariable("agentId") Long agentId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.agentActivities(agentId)));
    }

    @GetMapping("/client/{clientId}/profile")
    public ResponseEntity<ApiResponse<UserResponseDTO>> clientProfile(@PathVariable("clientId") Long clientId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.clientProfile(clientId)));
    }

    @GetMapping("/client/{clientId}/activities")
    public ResponseEntity<ApiResponse<List<UserActivityResponseDTO>>> clientActivity(@PathVariable("clientId") Long clientId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.clientActivity(clientId)));
    }

    @GetMapping("/client/{clientId}/risk-score")
    public ResponseEntity<ApiResponse<ClientRiskScoreDTO>> clientRiskScore(@PathVariable("clientId") Long clientId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.clientRiskScore(clientId)));
    }

    @GetMapping("/client/{clientId}/eligibility")
    public ResponseEntity<ApiResponse<ClientEligibilityDTO>> clientEligibility(@PathVariable("clientId") Long clientId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.clientEligibility(clientId)));
    }
}
