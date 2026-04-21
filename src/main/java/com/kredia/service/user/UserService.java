package com.kredia.service.user;

import com.kredia.dto.user.UserRequestDTO;
import com.kredia.dto.user.UserResponseDTO;
import com.kredia.dto.user.AdminUserUpdateDTO;
import com.kredia.dto.user.ClientProfileUpdateDTO;
import com.kredia.dto.user.AdminStatsDTO;
import com.kredia.dto.user.AgentPerformanceDTO;
import com.kredia.dto.user.ClientEligibilityDTO;
import com.kredia.dto.user.ClientRiskScoreDTO;
import com.kredia.dto.user.UserActivityResponseDTO;
import com.kredia.entity.user.UserRole;
import com.kredia.entity.user.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * User domain service.
 * Enforces business invariants and manages user-related operations.
 */
public interface UserService {

    // --- Basic CRUD & Management ---
    UserResponseDTO create(Long actorId, UserRequestDTO user);
    UserResponseDTO getById(Long actorId, Long id);
    Page<UserResponseDTO> search(
            Long actorId,
            Optional<String> email,
            Optional<UserStatus> status,
            Optional<UserRole> role,
            Optional<Instant> createdFrom,
            Optional<Instant> createdTo,
            Pageable pageable
    );

    UserResponseDTO update(Long actorId, Long id, UserRequestDTO payload);
    UserResponseDTO updateProfile(Long actorId, Long id, ClientProfileUpdateDTO payload);
    UserResponseDTO adminUpdateUser(Long actorId, Long id, AdminUserUpdateDTO payload);

    // --- Status & Lifecycle ---
    void delete(Long actorId, Long id);
    UserResponseDTO restore(Long actorId, Long id);
    UserResponseDTO block(Long actorId, Long id);
    UserResponseDTO suspend(Long actorId, Long id);
    UserResponseDTO activate(Long actorId, Long id);
    UserResponseDTO deactivate(Long actorId, Long id);
    UserResponseDTO changeRole(Long actorId, Long id, UserRole role);

    // --- Agent Assignments ---
    UserResponseDTO assignClientToAgent(Long actorId, Long agentId, Long clientId);
    UserResponseDTO unassignClient(Long actorId, Long clientId);

    // --- Bulk Actions ---
    void bulkDelete(Long actorId, List<Long> ids);
    void bulkUpdateStatus(Long actorId, List<Long> ids, UserStatus status);

    // --- Administrative Analytics ---
    AdminStatsDTO adminStats(Long actorId);
    Page<UserResponseDTO> adminAgent(Long actorId, Pageable pageable);
    Page<UserResponseDTO> adminClient(Long actorId, Pageable pageable);
    Page<UserResponseDTO> agentClients(Long actorId, Optional<String> email, Optional<UserStatus> status, Pageable pageable);
    Page<UserActivityResponseDTO> adminAudit(Long actorId, Long userId, Pageable pageable);
    Page<UserActivityResponseDTO> adminActivityByRole(Long actorId, Optional<UserRole> role, Pageable pageable);

    // --- Agent Performance & Activity ---
    AgentPerformanceDTO agentDashboard(Long agentId);
    AgentPerformanceDTO agentPerformance(Long agentId);
    Page<UserActivityResponseDTO> agentActivity(Long agentId, Optional<String> actionType, Optional<String> search, Pageable pageable);

    // --- Client Profile & Analytics ---
    UserResponseDTO clientProfile(Long clientId);
    Page<UserActivityResponseDTO> clientActivity(Long clientId, Pageable pageable);
    ClientRiskScoreDTO clientRiskScore(Long clientId);
    ClientEligibilityDTO clientEligibility(Long clientId);

    // --- Profile Picture Management ---
    UserResponseDTO updateProfilePicture(Long userId, String imageUrl);
    void deleteProfilePicture(Long userId);
}
