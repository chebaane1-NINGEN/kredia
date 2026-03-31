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
 *
 * <p>Business invariants enforced by this service:
 * <ul>
 *   <li>Status transitions are controlled (e.g. BLOCKED cannot be activated directly).</li>
 *   <li>Soft-deleted user cannot be mutated unless restored.</li>
 *   <li>ADMIN protections: last ADMIN cannot be deleted, blocked, or downgraded.</li>
 *   <li>Role assignment: ADMIN can only be assigned to ACTIVE users.</li>
 * </ul>
 */
public interface UserService {

    UserResponseDTO create(UserRequestDTO user); // Creation remains public for registration

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

    UserResponseDTO updateProfile(Long actorId, Long id, ClientProfileUpdateDTO payload);

    UserResponseDTO adminUpdateUser(Long actorId, Long id, AdminUserUpdateDTO payload);

    void delete(Long actorId, Long id);

    UserResponseDTO restore(Long actorId, Long id);

    UserResponseDTO block(Long actorId, Long id);

    UserResponseDTO suspend(Long actorId, Long id);

    UserResponseDTO activate(Long actorId, Long id);

    UserResponseDTO deactivate(Long actorId, Long id);

    UserResponseDTO changeRole(Long actorId, Long id, UserRole role);

    UserResponseDTO assignClientToAgent(Long actorId, Long agentId, Long clientId);
    
    UserResponseDTO unassignClient(Long actorId, Long clientId);

    AdminStatsDTO adminStats(Long actorId);

    Page<UserResponseDTO> adminAgent(Long actorId, Pageable pageable);

    Page<UserResponseDTO> adminClient(Long actorId, Pageable pageable);

    Page<UserActivityResponseDTO> adminAudit(Long actorId, Long userId, Pageable pageable);

    Page<UserActivityResponseDTO> adminActivityByRole(Long actorId, UserRole role, Pageable pageable);

    AgentPerformanceDTO agentDashboard(Long agentId);

    AgentPerformanceDTO agentPerformance(Long agentId);

    Page<UserActivityResponseDTO> agentActivity(Long agentId, Pageable pageable);

    UserResponseDTO clientProfile(Long clientId);

    Page<UserActivityResponseDTO> clientActivity(Long clientId, Pageable pageable);

    ClientRiskScoreDTO clientRiskScore(Long clientId);

    ClientEligibilityDTO clientEligibility(Long clientId);
}
