package com.kredia.service.impl.user;

import com.kredia.dto.user.AdminUserUpdateDTO;
import com.kredia.dto.user.ClientProfileUpdateDTO;
import com.kredia.dto.user.AdminStatsDTO;
import com.kredia.dto.user.AgentPerformanceDTO;
import com.kredia.dto.user.ClientEligibilityDTO;
import com.kredia.dto.user.ClientRiskScoreDTO;
import com.kredia.dto.user.UserActivityResponseDTO;
import com.kredia.dto.user.UserRequestDTO;
import com.kredia.dto.user.UserResponseDTO;
import com.kredia.entity.user.User;
import com.kredia.entity.user.UserActivity;
import com.kredia.entity.user.UserActivityActionType;
import com.kredia.entity.user.UserRole;
import com.kredia.entity.user.UserStatus;
import com.kredia.exception.BusinessException;
import com.kredia.exception.ForbiddenException;
import com.kredia.exception.ResourceNotFoundException;
import com.kredia.mapper.user.UserMapper;
import com.kredia.repository.user.KycDocumentRepository;
import com.kredia.repository.user.UserActivityRepository;
import com.kredia.repository.user.UserRepository;
import com.kredia.repository.user.UserSpecifications;
import com.kredia.service.user.EmailService;
import com.kredia.service.user.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
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
import java.util.UUID;

@Service
@SuppressWarnings("all")
public class UserServiceImpl implements UserService {

    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final UserActivityRepository userActivityRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper, UserActivityRepository userActivityRepository, KycDocumentRepository kycDocumentRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.userActivityRepository = userActivityRepository;
        this.kycDocumentRepository = kycDocumentRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public UserResponseDTO create(Long actorId, UserRequestDTO user) {
        Objects.requireNonNull(user, "user");

        User actor = loadActor(actorId);
        if (actor.getRole() != UserRole.ADMIN && actor.getRole() != UserRole.AGENT) {
            throw new ForbiddenException("Only admins and agents can create users");
        }

        if (userRepository.existsByEmailAndDeletedFalse(user.getEmail())) {
            throw new BusinessException("Email already exists");
        }
        if (user.getPhoneNumber() != null && userRepository.existsByPhoneNumberAndDeletedFalse(user.getPhoneNumber())) {
            throw new BusinessException("Phone number already exists");
        }

        User entity = userMapper.toEntityForCreate(user);
        entity.setId(null);
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            entity.setPasswordHash(passwordEncoder.encode(user.getPassword()));
        } else {
            String temporaryPassword = "Kredia" + java.util.UUID.randomUUID().toString().substring(0, 8);
            entity.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        }

        if (entity.getRole() == null) {
            entity.setRole(UserRole.CLIENT);
        }

        if (actor.getRole() == UserRole.AGENT) {
            if (entity.getRole() != UserRole.CLIENT) {
                throw new BusinessException("Agents can only create client accounts");
            }
            entity.setAssignedAgent(actor);
            entity.setStatus(UserStatus.PENDING_VERIFICATION);
            entity.setEmailVerified(false);
            entity.setDeleted(false);
            entity.setVerificationToken(java.util.UUID.randomUUID().toString());
            emailService.sendPasswordResetEmail(entity.getEmail(), entity.getVerificationToken());
            log.info("Agent created client {} and requested verification", entity.getEmail());
        } else {
            if (entity.getStatus() == null) entity.setStatus(UserStatus.PENDING_VERIFICATION);
            entity.setEmailVerified(entity.getStatus() == UserStatus.ACTIVE);
            entity.setDeleted(false);
        }

        User saved = userRepository.save(entity);
        recordActivity(saved.getId(), UserActivityActionType.CREATED, "User created by " + actor.getRole() + " " + actor.getEmail());
        log.info("user_created userId={} email={} createdBy={}", saved.getId(), saved.getEmail(), actor.getEmail());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponseDTO getById(Long actorId, Long id) {
        User actor = loadActor(actorId);
        User target = loadActor(id);
        
        validateAccess(actor, target);
        
        return userMapper.toResponse(target);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> search(
            Long actorId,
            Optional<String> email,
            Optional<UserStatus> status,
            Optional<UserRole> role,
            Optional<Instant> createdFrom,
            Optional<Instant> createdTo,
            Pageable pageable
    ) {
        User actor = loadActor(actorId);
        Specification<User> spec = UserSpecifications.notDeleted();

        if (actor.getRole() == UserRole.AGENT) {
            spec = spec.and(UserSpecifications.assignedAgentEquals(actor));
        } else if (actor.getRole() == UserRole.CLIENT) {
            // Clients can only search for themselves
            if (email.isPresent() && !email.get().equalsIgnoreCase(actor.getEmail())) {
                 return Page.empty();
            }
            spec = spec.and(UserSpecifications.emailEquals(actor.getEmail()));
        }

        if (email != null && email.isPresent() && !email.get().isBlank()) {
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
    public UserResponseDTO updateProfile(Long actorId, Long id, ClientProfileUpdateDTO payload) {
        User actor = loadActor(actorId);
        User target = findForMutation(id);
        
        validateAccess(actor, target);

        if (payload.getPhoneNumber() != null && userRepository.existsByPhoneNumberAndDeletedFalseAndIdNot(payload.getPhoneNumber(), id)) {
            throw new BusinessException("Phone number already exists");
        }

        if (payload.getNewPassword() != null && !payload.getNewPassword().isBlank()) {
            if (payload.getCurrentPassword() == null || payload.getCurrentPassword().isBlank()) {
                throw new BusinessException("Current password is required to change password");
            }
            if (!passwordEncoder.matches(payload.getCurrentPassword(), target.getPasswordHash())) {
                throw new BusinessException("Current password does not match");
            }
            target.setPasswordHash(passwordEncoder.encode(payload.getNewPassword()));
        }

        userMapper.copyClientProfileFields(payload, target);
        User saved = userRepository.save(target);
        recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "Profile updated by actor " + actorId);
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO update(Long actorId, Long id, UserRequestDTO payload) {
        User actor = loadActor(actorId);
        User target = findForMutation(id);

        if (actor.getRole() == UserRole.ADMIN) {
            if (payload.getEmail() != null && userRepository.existsByEmailAndDeletedFalseAndIdNot(payload.getEmail(), id)) {
                throw new BusinessException("Email already exists");
            }
            if (payload.getPhoneNumber() != null && userRepository.existsByPhoneNumberAndDeletedFalseAndIdNot(payload.getPhoneNumber(), id)) {
                throw new BusinessException("Phone number already exists");
            }
            if (payload.getEmail() != null) target.setEmail(payload.getEmail());
            if (payload.getFirstName() != null) target.setFirstName(payload.getFirstName());
            if (payload.getLastName() != null) target.setLastName(payload.getLastName());
            if (payload.getPhoneNumber() != null) target.setPhoneNumber(payload.getPhoneNumber());
            if (payload.getRole() != null) target.setRole(payload.getRole());
            if (payload.getStatus() != null) target.setStatus(payload.getStatus());
            User saved = userRepository.save(target);
            recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "Admin updated user details for " + saved.getEmail());
            return userMapper.toResponse(saved);
        }

        if (actor.getRole() == UserRole.AGENT) {
            if (target.getRole() != UserRole.CLIENT || !Objects.equals(target.getAssignedAgent(), actor)) {
                throw new ForbiddenException("Agents can only update assigned clients");
            }
            if (payload.getEmail() != null && !payload.getEmail().equalsIgnoreCase(target.getEmail()) && userRepository.existsByEmailAndDeletedFalseAndIdNot(payload.getEmail(), id)) {
                throw new BusinessException("Email already exists");
            }
            if (payload.getPhoneNumber() != null && !payload.getPhoneNumber().equals(target.getPhoneNumber()) && userRepository.existsByPhoneNumberAndDeletedFalseAndIdNot(payload.getPhoneNumber(), id)) {
                throw new BusinessException("Phone number already exists");
            }
            if (payload.getEmail() != null) target.setEmail(payload.getEmail());
            if (payload.getFirstName() != null) target.setFirstName(payload.getFirstName());
            if (payload.getLastName() != null) target.setLastName(payload.getLastName());
            if (payload.getPhoneNumber() != null) target.setPhoneNumber(payload.getPhoneNumber());
            User saved = userRepository.save(target);
            recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "Client updated by agent " + actor.getEmail());
            return userMapper.toResponse(saved);
        }

        throw new ForbiddenException("Only admins or assigned agents can update this user");
    }

    @Override
    @Transactional
    public UserResponseDTO adminUpdateUser(Long actorId, Long id, AdminUserUpdateDTO payload) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);

        User target = findForMutation(id);

        if (payload.getEmail() != null && userRepository.existsByEmailAndDeletedFalseAndIdNot(payload.getEmail(), id)) {
            throw new BusinessException("Email already exists");
        }
        if (payload.getPhoneNumber() != null && userRepository.existsByPhoneNumberAndDeletedFalseAndIdNot(payload.getPhoneNumber(), id)) {
            throw new BusinessException("Phone number already exists");
        }

        userMapper.copyAdminUserFields(payload, target);
        User saved = userRepository.save(target);
        recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "Admin updated user " + saved.getEmail());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> agentClients(Long agentId, Optional<String> email, Optional<UserStatus> status, Pageable pageable) {
        User actor = loadActor(agentId);
        validateRole(actor, UserRole.AGENT);

        Specification<User> spec = UserSpecifications.notDeleted()
                .and(UserSpecifications.assignedAgentEquals(actor));

        if (email != null && email.isPresent() && !email.get().isBlank()) {
            spec = spec.and(UserSpecifications.emailEquals(email.get()));
        }
        if (status != null && status.isPresent()) {
            spec = spec.and(UserSpecifications.statusEquals(status.get()));
        }

        return userRepository.findAll(spec, pageable).map(userMapper::toResponse);
    }

    @Override
    @Transactional
    public void delete(Long actorId, Long id) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);

        User target = findForMutation(id);

        // Protect the fixed admin
        if ("abidimouhamedali2@gmail.com".equals(target.getEmail())) {
            throw new ForbiddenException("Protected admin account cannot be deleted");
        }

        if (target.getRole() == UserRole.ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndDeletedFalseAndStatus(UserRole.ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1 && target.getStatus() == UserStatus.ACTIVE) {
                throw new BusinessException("Cannot delete the last active administrator");
            }
        }

        target.setDeleted(true);
        userRepository.save(target);

        recordActivity(target.getId(), UserActivityActionType.DELETED, "User soft-deleted by admin " + actor.getEmail());
        log.info("user_soft_deleted userId={} email={}", target.getId(), target.getEmail());
    }

    @Override
    @Transactional
    public UserResponseDTO restore(Long actorId, Long id) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (!target.isDeleted()) {
            return userMapper.toResponse(target);
        }

        target.setDeleted(false);
        User saved = userRepository.save(target);
        recordActivity(saved.getId(), UserActivityActionType.RESTORED, "User restored by admin " + actorId);
        log.info("user_restored userId={} email={}", saved.getId(), saved.getEmail());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO block(Long actorId, Long id) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);

        User user = findForMutation(id);

        // Protect the fixed admin
        if ("abidimouhamedali2@gmail.com".equals(user.getEmail())) {
            throw new ForbiddenException("Protected admin account cannot be blocked");
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new BusinessException("User is already blocked");
        }
        if (user.getRole() == UserRole.ADMIN && user.getStatus() == UserStatus.ACTIVE) {
            long activeAdminCount = userRepository.countByRoleAndDeletedFalseAndStatus(UserRole.ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new BusinessException("Cannot block the last active administrator");
            }
        }

        UserStatus previous = user.getStatus();
        user.setStatus(UserStatus.BLOCKED);
        User saved = userRepository.save(user);
        recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "User blocked by admin " + actor.getEmail());
        log.info("user_status_changed userId={} from={} to={}", saved.getId(), previous, saved.getStatus());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO suspend(Long actorId, Long id) {
        User actor = loadActor(actorId);
        // Admin or the assigned Agent can suspend a user
        User user = findForMutation(id);
        if (actor.getRole() != UserRole.ADMIN && !Objects.equals(user.getAssignedAgent(), actor)) {
             throw new ForbiddenException("Only admins or assigned agents can suspend users");
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new BusinessException("User is already suspended");
        }
        UserStatus previous = user.getStatus();
        user.setStatus(UserStatus.SUSPENDED);
        User saved = userRepository.save(user);
        recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "Status changed from " + previous + " to " + saved.getStatus() + " by actor " + actorId);
        log.info("user_status_changed userId={} from={} to={}", saved.getId(), previous, saved.getStatus());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO activate(Long actorId, Long id) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        
        User user = findForMutation(id);

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new BusinessException("Blocked user cannot be activated directly; set INACTIVE first");
        }
        if (user.getStatus() == UserStatus.SUSPENDED && !user.isEmailVerified()) {
            throw new BusinessException("Cannot activate suspended user without verification");
        }

        UserStatus previous = user.getStatus();
        user.setStatus(UserStatus.ACTIVE);
        User saved = userRepository.save(user);
        recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "Status changed from " + previous + " to " + saved.getStatus() + " by admin " + actorId);
        log.info("user_status_changed userId={} from={} to={}", saved.getId(), previous, saved.getStatus());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO deactivate(Long actorId, Long id) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);

        User user = findForMutation(id);
        if (user.getStatus() == UserStatus.INACTIVE) {
            return userMapper.toResponse(user);
        }
        UserStatus previous = user.getStatus();
        user.setStatus(UserStatus.INACTIVE);
        User saved = userRepository.save(user);
        recordActivity(saved.getId(), UserActivityActionType.STATUS_CHANGED, "Status changed from " + previous + " to " + saved.getStatus() + " by admin " + actorId);
        log.info("user_status_changed userId={} from={} to={}", saved.getId(), previous, saved.getStatus());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO changeRole(Long actorId, Long id, UserRole role) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);

        User user = findForMutation(id);

        // Protect the fixed admin
        if ("abidimouhamedali2@gmail.com".equals(user.getEmail())) {
            throw new ForbiddenException("Protected admin account role cannot be changed");
        }

        if (role == UserRole.ADMIN && user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException("Only ACTIVE users can be assigned ADMIN role");
        }

        if (user.getRole() == UserRole.ADMIN && role != UserRole.ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndDeletedFalseAndStatus(UserRole.ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1 && user.getStatus() == UserStatus.ACTIVE) {
                throw new BusinessException("Cannot downgrade the last active administrator");
            }
        }

        UserRole previous = user.getRole();
        user.setRole(role);
        User saved = userRepository.save(user);
        recordActivity(saved.getId(), UserActivityActionType.ROLE_CHANGED,
            String.format("Role changed from %s to %s by admin %s", previous, role, actor.getEmail()));
        log.info("user_role_changed userId={} from={} to={}", saved.getId(), previous, saved.getRole());
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO assignClientToAgent(Long actorId, Long agentId, Long clientId) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        
        User agent = loadActor(agentId);
        validateRole(agent, UserRole.AGENT);
        
        User client = loadActor(clientId);
        validateRole(client, UserRole.CLIENT);
        
        client.setAssignedAgent(agent);
        User saved = userRepository.save(client);
        
        recordActivity(clientId, UserActivityActionType.CLIENT_HANDLED, "Client assigned to agent " + agent.getFirstName() + " " + agent.getLastName());
        recordActivity(agentId, UserActivityActionType.CLIENT_HANDLED, "Handled client " + client.getFirstName() + " " + client.getLastName());
        
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponseDTO unassignClient(Long actorId, Long clientId) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        
        User client = loadActor(clientId);
        validateRole(client, UserRole.CLIENT);
        
        User agent = client.getAssignedAgent();
        if (agent != null) {
            client.setAssignedAgent(null);
            User saved = userRepository.save(client);
            
            recordActivity(clientId, UserActivityActionType.CLIENT_HANDLED, "Client unassigned from agent " + agent.getId());
            recordActivity(agent.getId(), UserActivityActionType.CLIENT_HANDLED, "Client " + clientId + " unassigned");
            
            return userMapper.toResponse(saved);
        }
        return userMapper.toResponse(client);
    }

    @Override
    @Transactional
    public void bulkDelete(Long actorId, List<Long> ids) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        
        for (Long id : ids) {
            try {
                delete(actorId, id);
            } catch (Exception e) {
                log.error("Failed to delete user {} during bulk operation: {}", id, e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public void bulkUpdateStatus(Long actorId, List<Long> ids, UserStatus status) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        
        for (Long id : ids) {
            try {
                switch (status) {
                    case ACTIVE -> activate(actorId, id);
                    case BLOCKED -> block(actorId, id);
                    case SUSPENDED -> suspend(actorId, id);
                    case INACTIVE -> deactivate(actorId, id);
                }
            } catch (Exception e) {
                log.error("Failed to update status of user {} to {} during bulk operation: {}", id, status, e.getMessage());
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AdminStatsDTO adminStats(Long actorId) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);

        long totalUser = userRepository.countByDeletedFalse();
        long totalClient = userRepository.countByRoleAndDeletedFalse(UserRole.CLIENT);
        long totalAgent = userRepository.countByRoleAndDeletedFalse(UserRole.AGENT);
        long activeUser = userRepository.countByStatusAndDeletedFalse(UserStatus.ACTIVE);
        long blockedUser = userRepository.countByStatusAndDeletedFalse(UserStatus.BLOCKED);
        long suspendedUser = userRepository.countByStatusAndDeletedFalse(UserStatus.SUSPENDED);
        long last24hRegistrations = userRepository.countByCreatedAtAfterAndDeletedFalse(Instant.now().minus(24, ChronoUnit.HOURS));

        Map<UserRole, Long> distribution = new EnumMap<>(UserRole.class);
        for (UserRole r : UserRole.values()) {
            distribution.put(r, userRepository.countByRoleAndDeletedFalse(r));
        }

        double health = 0.0;
        if (totalUser > 0) {
            health = (activeUser * 100.0) / totalUser;
        }

        AdminStatsDTO dto = new AdminStatsDTO();
        dto.setTotalUser(totalUser);
        dto.setTotalClient(totalClient);
        dto.setTotalAgent(totalAgent);
        dto.setActiveUser(activeUser);
        dto.setBlockedUser(blockedUser);
        dto.setSuspendedUser(suspendedUser);
        dto.setLast24hRegistrations(last24hRegistrations);
        dto.setRoleDistribution(distribution);
        dto.setSystemHealthIndex(health);

        // Populate registration evolution
        Map<String, Long> evolution = new java.util.LinkedHashMap<>();
        List<Object[]> evolutionData = userRepository.countRegistrationsByMonth();
        for (Object[] row : evolutionData) {
            evolution.put((String) row[0], ((Number) row[1]).longValue());
        }
        dto.setRegistrationEvolution(evolution);

        // Populate recent activities
        List<UserActivityResponseDTO> recentActivities = userActivityRepository.findTop10ByOrderByTimestampDesc()
                .stream()
                .map(this::mapActivity)
                .toList();
        dto.setRecentActivities(recentActivities);

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> adminAgent(Long actorId, Pageable pageable) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        return userRepository.findAllByRoleAndDeletedFalse(UserRole.AGENT, pageable).map(userMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponseDTO> adminClient(Long actorId, Pageable pageable) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        return userRepository.findAllByRoleAndDeletedFalse(UserRole.CLIENT, pageable).map(userMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserActivityResponseDTO> adminActivityByRole(Long actorId, Optional<UserRole> role, Pageable pageable) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        
        if (role != null && role.isPresent()) {
            return userActivityRepository.findAllByUserRoleOrderByTimestampDesc(role.get(), pageable).map(userMapper::toActivityResponse);
        }
        return userActivityRepository.findAllByOrderByTimestampDesc(pageable).map(userMapper::toActivityResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserActivityResponseDTO> adminAudit(Long actorId, Long userId, Pageable pageable) {
        User actor = loadActor(actorId);
        validateRole(actor, UserRole.ADMIN);
        User target = loadActor(userId);
        validateNotDeleted(target);
        return userActivityRepository.findByUserIdOrderByTimestampAsc(userId, pageable).map(this::mapActivity);
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
    public Page<UserActivityResponseDTO> agentActivity(Long agentId, Pageable pageable) {
        User agent = loadActor(agentId);
        validateRole(agent, UserRole.AGENT);
        return userActivityRepository.findByUserIdOrderByTimestampAsc(agentId, pageable).map(this::mapActivity);
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
    public Page<UserActivityResponseDTO> clientActivity(Long clientId, Pageable pageable) {
        User client = loadActor(clientId);
        validateRole(client, UserRole.CLIENT);
        return userActivityRepository.findByUserIdOrderByTimestampAsc(clientId, pageable).map(this::mapActivity);
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

        if (kycDocumentRepository.existsByUserIdAndStatus(clientId, com.kredia.enums.KycStatus.APPROVED)) {
            score += 20;
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
    
    private void validateAccess(User actor, User target) {
        if (actor.getRole() == UserRole.ADMIN) {
             return;
        }
        if (actor.getRole() == UserRole.AGENT) {
             if (target.getRole() == UserRole.CLIENT && Objects.equals(target.getAssignedAgent(), actor)) {
                  return;
             }
             if (Objects.equals(actor, target)) {
                  return;
             }
             throw new ForbiddenException("Agents can only access their assigned clients or their own profile");
        }
        if (actor.getRole() == UserRole.CLIENT) {
             if (!Objects.equals(actor, target)) {
                  throw new ForbiddenException("Clients can only access their own profile");
             }
             return;
        }
        throw new ForbiddenException("Access denied");
    }

    private UserActivityResponseDTO mapActivity(UserActivity a) {
        UserActivityResponseDTO dto = new UserActivityResponseDTO();
        dto.setId(a.getId());
        dto.setUserId(a.getUserId());
        dto.setActionType(a.getActionType());
        dto.setDescription(a.getDescription());
        dto.setTimestamp(a.getTimestamp());
        return dto;
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
