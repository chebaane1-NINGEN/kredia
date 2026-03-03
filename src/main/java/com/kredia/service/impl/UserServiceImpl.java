package com.kredia.service.impl;

import com.kredia.dto.AdminStatsDTO;
import com.kredia.dto.AgentPerformanceDTO;
import com.kredia.dto.ClientEligibilityDTO;
import com.kredia.dto.ClientRiskScoreDTO;
import com.kredia.dto.UserActivityResponseDTO;
import com.kredia.dto.UserRequestDTO;
import com.kredia.dto.UserResponseDTO;
import com.kredia.entity.User;
import com.kredia.entity.UserActivity;
import com.kredia.entity.UserActivityActionType;
import com.kredia.entity.UserRole;
import com.kredia.entity.UserStatus;
import com.kredia.exception.BusinessException;
import com.kredia.exception.ForbiddenException;
import com.kredia.exception.ResourceNotFoundException;
import com.kredia.mapper.UserMapper;
import com.kredia.repository.UserActivityRepository;
import com.kredia.repository.UserRepository;
import com.kredia.repository.UserSpecifications;
import com.kredia.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final UserActivityRepository userActivityRepository;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper, UserActivityRepository userActivityRepository) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.userActivityRepository = userActivityRepository;
    }

    @Override
    @Transactional
    public UserResponseDTO create(UserRequestDTO user) {
        Objects.requireNonNull(user, "user");

        if (userRepository.existsByEmailAndDeletedFalse(user.getEmail())) {
            throw new BusinessException("Email already exists");
        }
        if (userRepository.existsByPhoneNumberAndDeletedFalse(user.getPhoneNumber())) {
            throw new BusinessException("Phone number already exists");
        }

        User entity = userMapper.toEntityForCreate(user);
        entity.setId(null);
        entity.setStatus(UserStatus.PENDING_VERIFICATION);
        entity.setRole(UserRole.CLIENT);
        entity.setDeleted(false);
        entity.setEmailVerified(false);

        User saved = userRepository.save(entity);
        recordActivity(saved.getId(), UserActivityActionType.CREATED, "User created");
        log.info("user_created userId={} email={}", saved.getId(), saved.getEmail());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminStatsDTO adminStats(Long actorId) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);

        long totalUsers = userRepository.countByDeletedFalse();
        long totalClients = userRepository.countByRoleAndDeletedFalse(UserRole.CLIENT);
        long totalAgents = userRepository.countByRoleAndDeletedFalse(UserRole.AGENT);
        long activeUsers = userRepository.countByStatusAndDeletedFalse(UserStatus.ACTIVE);
        long blockedUsers = userRepository.countByStatusAndDeletedFalse(UserStatus.BLOCKED);
        long suspendedUsers = userRepository.countByStatusAndDeletedFalse(UserStatus.SUSPENDED);
        long last24hRegistrations = userRepository.countByCreatedAtAfterAndDeletedFalse(Instant.now().minus(24, ChronoUnit.HOURS));

        Map<UserRole, Long> distribution = new EnumMap<>(UserRole.class);
        for (UserRole r : UserRole.values()) {
            distribution.put(r, userRepository.countByRoleAndDeletedFalse(r));
        }

        double health = 0.0;
        if (totalUsers > 0) {
            health = (activeUsers * 100.0) / totalUsers;
        }

        AdminStatsDTO dto = new AdminStatsDTO();
        dto.setTotalUsers(totalUsers);
        dto.setTotalClients(totalClients);
        dto.setTotalAgents(totalAgents);
        dto.setActiveUsers(activeUsers);
        dto.setBlockedUsers(blockedUsers);
        dto.setSuspendedUsers(suspendedUsers);
        dto.setLast24hRegistrations(last24hRegistrations);
        dto.setRoleDistribution(distribution);
        dto.setSystemHealthIndex(health);
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> adminAgents(Long actorId, Pageable pageable) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        return userRepository.findAllByRoleAndDeletedFalse(UserRole.AGENT, pageable).map(userMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> adminClients(Long actorId, Pageable pageable) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        return userRepository.findAllByRoleAndDeletedFalse(UserRole.CLIENT, pageable).map(userMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserActivityResponseDTO> adminAudit(Long actorId, Long userId) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        User target = loadActor(userId);
        validateNotDeleted(target);
        return mapActivities(userActivityRepository.findByUserIdOrderByTimestampAsc(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserActivityResponseDTO> adminActivitiesByRole(Long actorId, UserRole role, Pageable pageable) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);

        Set<Long> ids = new HashSet<>();
        userRepository.findAllByRoleAndDeletedFalse(role, pageable).forEach(u -> ids.add(u.getId()));
        if (ids.isEmpty()) {
            return List.of();
        }
        return mapActivities(userActivityRepository.findByUserIdInOrderByTimestampAsc(ids));
    }

    @Override
    @Transactional(readOnly = true)
    public AgentPerformanceDTO agentDashboard(Long agentId) {
        return agentPerformance(agentId);
    }

    @Override
    @Transactional(readOnly = true)
    public AgentPerformanceDTO agentPerformance(Long agentId) {
        User agent = loadActor(agentId);
        validateRole(agent, UserRole.AGENT);

        if (agent.getStatus() == UserStatus.SUSPENDED) {
            return new AgentPerformanceDTO();
        }

        List<UserActivity> acts = userActivityRepository.findByUserIdOrderByTimestampAsc(agentId);
        long approvals = acts.stream().filter(a -> a.getActionType() == UserActivityActionType.APPROVAL).count();
        long rejections = acts.stream().filter(a -> a.getActionType() == UserActivityActionType.REJECTION).count();
        long handled = acts.stream().filter(a -> a.getActionType() == UserActivityActionType.CLIENT_HANDLED).count();

        long totalActions = approvals + rejections;
        double score = 0.0;
        if (totalActions > 0) {
            score = (approvals * 100.0) / totalActions;
        }

        double avgProcessingSeconds = computeAverageProcessingTimeSeconds(acts);

        AgentPerformanceDTO dto = new AgentPerformanceDTO();
        dto.setApprovalActionsCount(approvals);
        dto.setRejectionActionsCount(rejections);
        dto.setTotalActions(totalActions);
        dto.setPerformanceScore(score);
        dto.setNumberOfClientsHandled(handled);
        dto.setAverageProcessingTimeSeconds(avgProcessingSeconds);
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserActivityResponseDTO> agentActivities(Long agentId) {
        User agent = loadActor(agentId);
        validateRole(agent, UserRole.AGENT);
        return mapActivities(userActivityRepository.findByUserIdOrderByTimestampAsc(agentId));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDTO clientProfile(Long clientId) {
        User client = loadActor(clientId);
        validateRole(client, UserRole.CLIENT);
        if (client.getStatus() == UserStatus.SUSPENDED) {
            UserResponseDTO res = userMapper.toResponse(client);
            res.setPhoneNumber(null);
            return res;
        }
        return userMapper.toResponse(client);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserActivityResponseDTO> clientActivity(Long clientId) {
        User client = loadActor(clientId);
        validateRole(client, UserRole.CLIENT);
        return mapActivities(userActivityRepository.findByUserIdOrderByTimestampAsc(clientId));
    }

    @Override
    @Transactional(readOnly = true)
    public ClientRiskScoreDTO clientRiskScore(Long clientId) {
        User client = loadActor(clientId);
        validateRole(client, UserRole.CLIENT);

        List<UserActivity> acts = userActivityRepository.findByUserIdOrderByTimestampAsc(clientId);

        int score = 50;
        if (client.getStatus() == UserStatus.ACTIVE) {
            score += 10;
        }
        if (hasEverBeenSuspended(acts)) {
            score -= 20;
        }

        score += (acts.size() * 2);

        long ageDays = ChronoUnit.DAYS.between(client.getCreatedAt(), Instant.now());
        score += (int) (ageDays / 30);

        if (client.getStatus() == UserStatus.SUSPENDED) {
            score = Math.min(score, 30);
        }

        score = clamp(score, 0, 100);

        ClientRiskScoreDTO dto = new ClientRiskScoreDTO();
        dto.setRiskScore(score);
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public ClientEligibilityDTO clientEligibility(Long clientId) {
        User client = loadActor(clientId);
        validateRole(client, UserRole.CLIENT);

        int score = clientRiskScore(clientId).getRiskScore();

        ClientEligibilityDTO dto = new ClientEligibilityDTO();
        if (client.getStatus() == UserStatus.BLOCKED) {
            dto.setEligible(false);
            dto.setReason("Client is BLOCKED");
            return dto;
        }
        if (client.getStatus() == UserStatus.SUSPENDED) {
            dto.setEligible(false);
            dto.setReason("Client is SUSPENDED");
            return dto;
        }
        if (client.getStatus() != UserStatus.ACTIVE) {
            dto.setEligible(false);
            dto.setReason("Client must be ACTIVE");
            return dto;
        }
        if (score < 60) {
            dto.setEligible(false);
            dto.setReason("Risk score too low");
            return dto;
        }

        dto.setEligible(true);
        dto.setReason("Eligible");
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDTO getById(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id");
        User user = userRepository.findByIdAndDeletedFalse(requiredId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + requiredId));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> search(
            Optional<String> email,
            Optional<UserStatus> status,
            Optional<UserRole> role,
            Optional<Instant> createdFrom,
            Optional<Instant> createdTo,
            Pageable pageable
    ) {
        Specification<User> spec = UserSpecifications.notDeleted();

        if (email != null && email.isPresent()) {
            spec = spec.and(UserSpecifications.emailEquals(email.get()));
        }
        if (status != null && status.isPresent()) {
            spec = spec.and(UserSpecifications.statusEquals(status.get()));
        }
        if (role != null && role.isPresent()) {
            spec = spec.and(UserSpecifications.roleEquals(role.get()));
        }
        if (createdFrom != null && createdFrom.isPresent()) {
            spec = spec.and(UserSpecifications.createdAtFrom(createdFrom.get()));
        }
        if (createdTo != null && createdTo.isPresent()) {
            spec = spec.and(UserSpecifications.createdAtTo(createdTo.get()));
        }

        return userRepository.findAll(spec, pageable).map(userMapper::toResponse);
    }

    @Override
    @Transactional
    public UserResponseDTO update(Long id, UserRequestDTO payload) {
        Long requiredId = Objects.requireNonNull(id, "id");
        Objects.requireNonNull(payload, "payload");

        User existing = findForMutation(requiredId);

        if (userRepository.existsByEmailAndDeletedFalseAndIdNot(payload.getEmail(), requiredId)) {
            throw new BusinessException("Email already exists");
        }
        if (userRepository.existsByPhoneNumberAndDeletedFalseAndIdNot(payload.getPhoneNumber(), requiredId)) {
            throw new BusinessException("Phone number already exists");
        }

        userMapper.copyUpdatableFields(payload, existing);
        return userMapper.toResponse(userRepository.save(existing));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id");

        User existing = findForMutation(requiredId);

        if (existing.getRole() == UserRole.ADMIN) {
            long adminCount = userRepository.countByRoleAndDeletedFalse(UserRole.ADMIN);
            if (adminCount <= 1) {
                throw new BusinessException("Cannot delete last ADMIN");
            }
        }

        existing.setDeleted(true);
        userRepository.save(existing);

        recordActivity(existing.getId(), UserActivityActionType.DELETED, "User soft deleted");
        log.info("user_soft_deleted userId={} email={}", existing.getId(), existing.getEmail());
    }

    @Override
    @Transactional
    public UserResponseDTO restore(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id");
        User existing = userRepository.findById(requiredId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + requiredId));

        if (!existing.isDeleted()) {
            return userMapper.toResponse(existing);
        }

        existing.setDeleted(false);
        User saved = userRepository.save(existing);
        recordActivity(saved.getId(), UserActivityActionType.RESTORED, "User restored");
        log.info("user_restored userId={} email={}", saved.getId(), saved.getEmail());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO block(Long id) {
        User user = findForMutation(Objects.requireNonNull(id, "id"));
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new BusinessException("User is already blocked");
        }
        if (user.getRole() == UserRole.ADMIN) {
            long adminCount = userRepository.countByRoleAndDeletedFalse(UserRole.ADMIN);
            if (adminCount <= 1) {
                throw new BusinessException("Cannot block last ADMIN");
            }
        }

        UserStatus previous = user.getStatus();
        user.setStatus(UserStatus.BLOCKED);
        User saved = userRepository.save(user);
        recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "Status changed from " + previous + " to " + saved.getStatus());
        log.info("user_status_changed userId={} from={} to={}", saved.getId(), previous, saved.getStatus());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO suspend(Long id) {
        User user = findForMutation(Objects.requireNonNull(id, "id"));
        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new BusinessException("User is already suspended");
        }
        UserStatus previous = user.getStatus();
        user.setStatus(UserStatus.SUSPENDED);
        User saved = userRepository.save(user);
        recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "Status changed from " + previous + " to " + saved.getStatus());
        log.info("user_status_changed userId={} from={} to={}", saved.getId(), previous, saved.getStatus());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO activate(Long id) {
        User user = findForMutation(Objects.requireNonNull(id, "id"));

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new BusinessException("Blocked user cannot be activated directly; set INACTIVE first");
        }
        if (user.getStatus() == UserStatus.SUSPENDED && !user.isEmailVerified()) {
            throw new BusinessException("Cannot activate suspended user without verification");
        }

        UserStatus previous = user.getStatus();
        user.setStatus(UserStatus.ACTIVE);
        User saved = userRepository.save(user);
        recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "Status changed from " + previous + " to " + saved.getStatus());
        log.info("user_status_changed userId={} from={} to={}", saved.getId(), previous, saved.getStatus());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO deactivate(Long id) {
        User user = findForMutation(Objects.requireNonNull(id, "id"));
        if (user.getStatus() == UserStatus.INACTIVE) {
            return userMapper.toResponse(user);
        }
        UserStatus previous = user.getStatus();
        user.setStatus(UserStatus.INACTIVE);
        User saved = userRepository.save(user);
        recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "Status changed from " + previous + " to " + saved.getStatus());
        log.info("user_status_changed userId={} from={} to={}", saved.getId(), previous, saved.getStatus());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO changeRole(Long id, UserRole role) {
        Long requiredId = Objects.requireNonNull(id, "id");
        UserRole requiredRole = Objects.requireNonNull(role, "role");

        User user = findForMutation(requiredId);

        if (requiredRole == UserRole.ADMIN && user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException("Only ACTIVE users can be assigned ADMIN role");
        }

        if (user.getRole() == UserRole.ADMIN && requiredRole != UserRole.ADMIN) {
            long adminCount = userRepository.countByRoleAndDeletedFalse(UserRole.ADMIN);
            if (adminCount <= 1) {
                throw new BusinessException("Cannot downgrade last ADMIN");
            }
        }

        UserRole previous = user.getRole();
        user.setRole(requiredRole);
        User saved = userRepository.save(user);
        recordActivity(saved.getId(), UserActivityActionType.ROLE_CHANGED, "Role changed from " + previous + " to " + saved.getRole());
        log.info("user_role_changed userId={} from={} to={}", saved.getId(), previous, saved.getRole());
        return userMapper.toResponse(saved);
    }

    private User findForMutation(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        if (user.isDeleted()) {
            throw new BusinessException("Deleted user cannot be modified; restore first");
        }
        return user;
    }

    private void recordActivity(Long userId, UserActivityActionType type, String description) {
        UserActivity activity = new UserActivity();
        activity.setUserId(userId);
        activity.setActionType(type);
        activity.setDescription(description);
        activity.setTimestamp(Instant.now());
        userActivityRepository.save(activity);
    }

    private User loadActor(Long id) {
        Long requiredId = Objects.requireNonNull(id, "id");
        User user = userRepository.findById(requiredId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + requiredId));
        validateNotDeleted(user);
        return user;
    }

    private void validateNotDeleted(User user) {
        if (user.isDeleted()) {
            throw new ForbiddenException("Deleted users cannot access this resource");
        }
    }

    private void validateRole(User actor, UserRole expected) {
        if (actor.getRole() != expected) {
            throw new ForbiddenException("Access denied");
        }
    }

    private List<UserActivityResponseDTO> mapActivities(List<UserActivity> activities) {
        List<UserActivityResponseDTO> out = new ArrayList<>();
        for (UserActivity a : activities) {
            UserActivityResponseDTO dto = new UserActivityResponseDTO();
            dto.setId(a.getId());
            dto.setUserId(a.getUserId());
            dto.setActionType(a.getActionType());
            dto.setDescription(a.getDescription());
            dto.setTimestamp(a.getTimestamp());
            out.add(dto);
        }
        return out;
    }

    private boolean hasEverBeenSuspended(List<UserActivity> activities) {
        for (UserActivity a : activities) {
            if (a.getActionType() == UserActivityActionType.STATUS_CHANGED && a.getDescription() != null) {
                if (a.getDescription().contains("to SUSPENDED")) {
                    return true;
                }
            }
        }
        return false;
    }

    private double computeAverageProcessingTimeSeconds(List<UserActivity> activities) {
        List<Instant> started = new ArrayList<>();
        List<Long> durations = new ArrayList<>();

        for (UserActivity a : activities) {
            if (a.getActionType() == UserActivityActionType.PROCESSING_STARTED) {
                started.add(a.getTimestamp());
            }
            if (a.getActionType() == UserActivityActionType.PROCESSING_COMPLETED && !started.isEmpty()) {
                Instant s = started.remove(0);
                durations.add(ChronoUnit.SECONDS.between(s, a.getTimestamp()));
            }
        }

        if (durations.isEmpty()) {
            return 0.0;
        }
        long sum = 0;
        for (Long d : durations) {
            sum += d;
        }
        return sum / (double) durations.size();
    }

    private int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }
}
