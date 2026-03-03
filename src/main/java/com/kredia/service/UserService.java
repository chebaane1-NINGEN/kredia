package com.kredia.service;

import com.kredia.dto.UserRequestDTO;
import com.kredia.dto.UserResponseDTO;
import com.kredia.dto.AdminStatsDTO;
import com.kredia.dto.AgentPerformanceDTO;
import com.kredia.dto.ClientEligibilityDTO;
import com.kredia.dto.ClientRiskScoreDTO;
import com.kredia.dto.UserActivityResponseDTO;
import com.kredia.enums.UserRole;
import com.kredia.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * User domain service.
 *
 * <p>Business invariants enforced by this service:
 * <ul>
 *   <li>Status transitions are controlled (e.g. BLOCKED cannot be activated directly).</li>
 *   <li>Soft-deleted users cannot be mutated unless restored.</li>
 *   <li>ADMIN protections: last ADMIN cannot be deleted, blocked, or downgraded.</li>
 *   <li>Role assignment: ADMIN can only be assigned to ACTIVE users.</li>
 * </ul>
 */
public interface UserService {

    UserResponseDTO create(UserRequestDTO user);

    UserResponseDTO getById(Long id);

    Page<UserResponseDTO> search(
            Optional<String> email,
            Optional<UserStatus> status,
            Optional<UserRole> role,
            Optional<Instant> createdFrom,
            Optional<Instant> createdTo,
            Pageable pageable
    );

    UserResponseDTO update(Long id, UserRequestDTO payload);

    void delete(Long id);

    UserResponseDTO restore(Long id);

    /**
     * Blocks a user.
     *
     * <p>Invariant: cannot block an already blocked user; cannot block the last ADMIN.
     */
    UserResponseDTO block(Long id);

    /**
     * Suspends a user.
     *
     * <p>Invariant: cannot suspend an already suspended user.
     */
    UserResponseDTO suspend(Long id);

    /**
     * Activates a user.
     *
     * <p>Invariants:
     * <ul>
     *   <li>BLOCKED cannot be activated directly (must go through INACTIVE first).</li>
     *   <li>SUSPENDED requires verification before activation.</li>
     * </ul>
     */
    UserResponseDTO activate(Long id);

    /**
     * Deactivates a user (sets status to INACTIVE).
     */
    UserResponseDTO deactivate(Long id);

    /**
     * Changes a user's role.
     *
     * <p>Invariants:
     * <ul>
     *   <li>ADMIN can only be assigned to ACTIVE users.</li>
     *   <li>The last ADMIN cannot be downgraded.</li>
     * </ul>
     */
    UserResponseDTO changeRole(Long id, UserRole role);

    AdminStatsDTO adminStats(Long actorId);

    Page<UserResponseDTO> adminAgents(Long actorId, Pageable pageable);

    Page<UserResponseDTO> adminClients(Long actorId, Pageable pageable);

    List<UserActivityResponseDTO> adminAudit(Long actorId, Long userId);

    List<UserActivityResponseDTO> adminActivitiesByRole(Long actorId, UserRole role, Pageable pageable);

    AgentPerformanceDTO agentDashboard(Long agentId);

    AgentPerformanceDTO agentPerformance(Long agentId);

    List<UserActivityResponseDTO> agentActivities(Long agentId);

    UserResponseDTO clientProfile(Long clientId);

    List<UserActivityResponseDTO> clientActivity(Long clientId);

    ClientRiskScoreDTO clientRiskScore(Long clientId);

    ClientEligibilityDTO clientEligibility(Long clientId);
}
