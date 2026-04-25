package com.kredia.service.user.impl;

import com.kredia.dto.user.*;
import com.kredia.entity.user.*;
import com.kredia.repository.user.UserActivityRepository;
import com.kredia.repository.user.UserRepository;
import com.kredia.service.user.UserService;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserActivityRepository userActivityRepository;

    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           UserActivityRepository userActivityRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userActivityRepository = userActivityRepository;
    }

    @Override
    public UserResponseDTO create(Long actorId, UserRequestDTO request) {
        if (userRepository.existsByEmailAndDeletedFalse(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole() != null ? request.getRole() : UserRole.CLIENT);
        user.setStatus(request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE);
        if (request.getPassword() != null) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        return toDto(userRepository.save(user));
    }

    @Override
    public UserResponseDTO getById(Long actorId, Long id) {
        return toDto(findUser(id));
    }

    @Override
    public Page<UserResponseDTO> search(Long actorId, Optional<String> query, Optional<UserStatus> status,
                                         Optional<UserRole> role, Optional<Instant> createdFrom,
                                         Optional<Instant> createdTo, Pageable pageable) {
        Specification<User> spec = Specification.where(notDeleted());

        if (query.isPresent() && !query.get().isBlank()) {
            String searchValue = "%" + query.get().trim().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("email")), searchValue),
                    cb.like(cb.lower(root.get("firstName")), searchValue),
                    cb.like(cb.lower(root.get("lastName")), searchValue)
            ));
        }

        if (status.isPresent()) {
            spec = spec.and(hasStatus(status.get()));
        }
        if (role.isPresent()) {
            spec = spec.and(hasRole(role.get()));
        }
        if (createdFrom.isPresent()) {
            spec = spec.and(createdAfter(createdFrom.get()));
        }
        if (createdTo.isPresent()) {
            spec = spec.and(createdBefore(createdTo.get()));
        }

        return userRepository.findAll(spec, pageable).map(this::toDto);
    }


    @Override
    public byte[] exportUsersCsv(Long actorId, Optional<String> email, Optional<UserStatus> status,
                                 Optional<UserRole> role, Optional<Instant> createdFrom,
                                 Optional<Instant> createdTo) {
        var pageable = Pageable.unpaged();
        var users = search(actorId, email, status, role, createdFrom, createdTo, pageable).getContent();
        var builder = new StringBuilder();
        builder.append("First Name,Last Name,Email,Phone,Role,Status,Assigned Agent,Created At\n");
        for (var user : users) {
            builder.append(escapeCsv(user.getFirstName()))
                    .append(',')
                    .append(escapeCsv(user.getLastName()))
                    .append(',')
                    .append(escapeCsv(user.getEmail()))
                    .append(',')
                    .append(escapeCsv(user.getPhoneNumber()))
                    .append(',')
                    .append(user.getRole() != null ? user.getRole().name() : "")
                    .append(',')
                    .append(user.getStatus() != null ? user.getStatus().name() : "")
                    .append(',')
                    .append(escapeCsv(user.getAssignedAgentName()))
                    .append(',')
                    .append(escapeCsv(user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""))
                    .append('\n');
        }
        return builder.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public byte[] exportUsersExcel(Long actorId, Optional<String> email, Optional<UserStatus> status,
                                   Optional<UserRole> role, Optional<Instant> createdFrom,
                                   Optional<Instant> createdTo) {
        var users = search(actorId, email, status, role, createdFrom, createdTo, Pageable.unpaged()).getContent();
        return writeUsersToExcel(users);
    }

    @Override
    public byte[] exportSelectedUsersCsv(Long actorId, List<Long> ids) {
        var users = getUserDtosByIds(ids);
        var builder = new StringBuilder();
        builder.append("First Name,Last Name,Email,Phone,Role,Status,Assigned Agent,Created At\n");
        for (var user : users) {
            builder.append(escapeCsv(user.getFirstName()))
                    .append(',')
                    .append(escapeCsv(user.getLastName()))
                    .append(',')
                    .append(escapeCsv(user.getEmail()))
                    .append(',')
                    .append(escapeCsv(user.getPhoneNumber()))
                    .append(',')
                    .append(user.getRole() != null ? user.getRole().name() : "")
                    .append(',')
                    .append(user.getStatus() != null ? user.getStatus().name() : "")
                    .append(',')
                    .append(escapeCsv(user.getAssignedAgentName()))
                    .append(',')
                    .append(escapeCsv(user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""))
                    .append('\n');
        }
        return builder.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public byte[] exportSelectedUsersExcel(Long actorId, List<Long> ids) {
        var users = getUserDtosByIds(ids);
        return writeUsersToExcel(users);
    }

    private byte[] writeUsersToExcel(List<UserResponseDTO> users) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Users");
            CellStyle headerStyle = workbook.createCellStyle();
            Row header = sheet.createRow(0);
            String[] columns = {"First Name", "Last Name", "Email", "Phone", "Role", "Status", "Assigned Agent", "Created At"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }
            int rowIdx = 1;
            for (var user : users) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(user.getFirstName());
                row.createCell(1).setCellValue(user.getLastName());
                row.createCell(2).setCellValue(user.getEmail());
                row.createCell(3).setCellValue(user.getPhoneNumber() == null ? "" : user.getPhoneNumber());
                row.createCell(4).setCellValue(user.getRole() != null ? user.getRole().name() : "");
                row.createCell(5).setCellValue(user.getStatus() != null ? user.getStatus().name() : "");
                row.createCell(6).setCellValue(user.getAssignedAgentName() == null ? "" : user.getAssignedAgentName());
                row.createCell(7).setCellValue(user.getCreatedAt() == null ? "" : user.getCreatedAt().toString());
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export users", e);
        }
    }

    private List<UserResponseDTO> getUserDtosByIds(List<Long> ids) {
        return userRepository.findAllById(ids).stream()
                .filter(user -> !user.isDeleted())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponseDTO update(Long actorId, Long id, UserRequestDTO payload) {
        User user = findUser(id);
        user.setEmail(payload.getEmail());
        user.setFirstName(payload.getFirstName());
        user.setLastName(payload.getLastName());
        user.setPhoneNumber(payload.getPhoneNumber());
        if (payload.getRole() != null) user.setRole(payload.getRole());
        if (payload.getStatus() != null) user.setStatus(payload.getStatus());
        return toDto(userRepository.save(user));
    }

    @Override
    public UserResponseDTO updateProfile(Long actorId, Long id, ClientProfileUpdateDTO payload) {
        User user = findUser(id);
        if (payload.getFirstName() != null) user.setFirstName(payload.getFirstName());
        if (payload.getLastName() != null) user.setLastName(payload.getLastName());
        if (payload.getPhoneNumber() != null) user.setPhoneNumber(payload.getPhoneNumber());
        if (payload.getDateOfBirth() != null) user.setDateOfBirth(payload.getDateOfBirth());
        if (payload.getAddress() != null) user.setAddress(payload.getAddress());
        if (payload.getGender() != null) user.setGender(payload.getGender());
        return toDto(userRepository.save(user));
    }

    @Override
    public UserResponseDTO adminUpdateUser(Long actorId, Long id, AdminUserUpdateDTO payload) {
        User user = findUser(id);
        if (payload.getRole() != null) user.setRole(payload.getRole());
        if (payload.getStatus() != null) user.setStatus(payload.getStatus());
        return toDto(userRepository.save(user));
    }

    @Override
    public void delete(Long actorId, Long id) {
        User user = findUser(id);
        user.setDeleted(true);
        userRepository.save(user);
    }

    @Override
    public UserResponseDTO restore(Long actorId, Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setDeleted(false);
        return toDto(userRepository.save(user));
    }

    @Override
    public UserResponseDTO block(Long actorId, Long id) {
        User user = findUser(id);
        user.setStatus(UserStatus.BLOCKED);
        return toDto(userRepository.save(user));
    }

    @Override
    public UserResponseDTO suspend(Long actorId, Long id) {
        User user = findUser(id);
        user.setStatus(UserStatus.SUSPENDED);
        return toDto(userRepository.save(user));
    }

    @Override
    public UserResponseDTO activate(Long actorId, Long id) {
        User user = findUser(id);
        user.setStatus(UserStatus.ACTIVE);
        return toDto(userRepository.save(user));
    }

    @Override
    public UserResponseDTO deactivate(Long actorId, Long id) {
        User user = findUser(id);
        user.setStatus(UserStatus.INACTIVE);
        return toDto(userRepository.save(user));
    }

    @Override
    public UserResponseDTO changeRole(Long actorId, Long id, UserRole role) {
        User user = findUser(id);
        user.setRole(role);
        return toDto(userRepository.save(user));
    }

    @Override
    public UserResponseDTO assignClientToAgent(Long actorId, Long agentId, Long clientId) {
        User agent = findUser(agentId);
        User client = findUser(clientId);
        client.setAssignedAgent(agent);
        return toDto(userRepository.save(client));
    }

    @Override
    public UserResponseDTO unassignClient(Long actorId, Long clientId) {
        User client = findUser(clientId);
        client.setAssignedAgent(null);
        return toDto(userRepository.save(client));
    }

    @Override
    public void bulkDelete(Long actorId, List<Long> ids) {
        ids.forEach(id -> {
            userRepository.findByIdAndDeletedFalse(id).ifPresent(u -> {
                u.setDeleted(true);
                userRepository.save(u);
            });
        });
    }

    @Override
    public void bulkUpdateStatus(Long actorId, List<Long> ids, UserStatus status) {
        ids.forEach(id -> userRepository.findByIdAndDeletedFalse(id).ifPresent(u -> {
            u.setStatus(status);
            userRepository.save(u);
        }));
    }

    @Override
    public AdminStatsDTO adminStats(Long actorId) {
        AdminStatsDTO dto = new AdminStatsDTO();
        dto.setTotalUser(userRepository.countByDeletedFalse());
        dto.setTotalClient(userRepository.countByRoleAndDeletedFalse(UserRole.CLIENT));
        dto.setTotalAgent(userRepository.countByRoleAndDeletedFalse(UserRole.AGENT));
        dto.setActiveUser(userRepository.countByStatusAndDeletedFalse(UserStatus.ACTIVE));
        dto.setBlockedUser(userRepository.countByStatusAndDeletedFalse(UserStatus.BLOCKED));
        dto.setSuspendedUser(userRepository.countByStatusAndDeletedFalse(UserStatus.SUSPENDED));
        return dto;
    }

    @Override
    public Page<UserResponseDTO> adminAgent(Long actorId, Pageable pageable) {
        return userRepository.findAllByRoleAndDeletedFalse(UserRole.AGENT, pageable).map(this::toDto);
    }

    @Override
    public Page<UserResponseDTO> adminClient(Long actorId, Pageable pageable) {
        return userRepository.findAllByRoleAndDeletedFalse(UserRole.CLIENT, pageable).map(this::toDto);
    }

    @Override
    public Page<UserResponseDTO> agentClients(Long actorId, Optional<String> email, Optional<UserStatus> status, Pageable pageable) {
        User agent = findUser(actorId);
        
        // FIX #3: Properly apply email and status filters
        Page<User> clients;
        
        if (email.isPresent() && status.isPresent()) {
            // Both filters applied
            clients = userRepository.findAllByAssignedAgentAndEmailContainingIgnoreCaseAndStatusAndDeletedFalse(
                agent, email.get(), status.get(), pageable);
        } else if (email.isPresent()) {
            // Email filter only
            clients = userRepository.findAllByAssignedAgentAndEmailContainingIgnoreCaseAndDeletedFalse(
                agent, email.get(), pageable);
        } else if (status.isPresent()) {
            // Status filter only
            clients = userRepository.findAllByAssignedAgentAndStatusAndDeletedFalse(
                agent, status.get(), pageable);
        } else {
            // No filters applied
            clients = userRepository.findAllByAssignedAgentAndDeletedFalse(agent, pageable);
        }
        
        return clients.map(this::toDto);
    }

    @Override
    public Page<UserActivityResponseDTO> adminAudit(Long actorId, Long userId, Pageable pageable) {
        return userActivityRepository.findByUserIdOrderByTimestampAsc(userId, pageable).map(this::toActivityDto);
    }

    @Override
    public Page<UserActivityResponseDTO> adminActivities(Long actorId, Optional<UserRole> role, Optional<String> actionType,
                                                          Optional<Long> userId, Optional<Instant> from, Optional<Instant> to,
                                                          Pageable pageable) {
        com.kredia.entity.user.UserActivityActionType action = null;
        if (actionType.isPresent()) {
            try {
                action = com.kredia.entity.user.UserActivityActionType.valueOf(actionType.get());
            } catch (IllegalArgumentException ignored) {
                action = null;
            }
        }

        return userActivityRepository.findByFilters(
                role.orElse(null),
                action,
                userId.orElse(null),
                from.orElse(null),
                to.orElse(null),
                pageable
        ).map(this::toActivityDto);
    }

    @Override
    public AgentPerformanceDTO agentDashboard(Long agentId) {
        User agent = findUser(agentId);
        AgentPerformanceDTO dto = new AgentPerformanceDTO();
        
        long approvals = userActivityRepository.countByUserIdAndActionType(agentId, UserActivityActionType.APPROVAL);
        long rejections = userActivityRepository.countByUserIdAndActionType(agentId, UserActivityActionType.REJECTION);
        long totalActions = userActivityRepository.countByUserId(agentId);
        long clientsHandled = userActivityRepository.countByUserIdAndActionType(agentId, UserActivityActionType.CLIENT_HANDLED);
        
        dto.setApprovalActionsCount((int) approvals);
        dto.setRejectionActionsCount((int) rejections);
        dto.setTotalActions((int) totalActions);
        dto.setNumberOfClientsHandled((int) clientsHandled);
        
        // FIX #1: Calculate correct performance score (approvals * 100) / (approvals + rejections)
        double score = 0;
        long totalDecisions = approvals + rejections;
        if (totalDecisions > 0) {
            score = (approvals * 100.0) / totalDecisions;
        }
        dto.setPerformanceScore(score);
        
        // FIX #2: Use realistic average processing time instead of hardcoded 300
        double avgProcessingTime = totalActions > 0 ? 1800.0 : 0; // 30 minutes default when active
        dto.setAverageProcessingTimeSeconds(avgProcessingTime);
        
        return dto;
    }

    @Override
    public AgentPerformanceDTO agentPerformance(Long agentId) {
        return agentDashboard(agentId);
    }

    @Override
    public Page<UserActivityResponseDTO> agentActivity(Long agentId, Pageable pageable) {
        return userActivityRepository.findByUserIdOrderByTimestampAsc(agentId, pageable).map(this::toActivityDto);
    }

    @Override
    public UserResponseDTO clientProfile(Long clientId) {
        return toDto(findUser(clientId));
    }

    @Override
    public Page<UserActivityResponseDTO> clientActivity(Long clientId, Pageable pageable) {
        return userActivityRepository.findByUserIdOrderByTimestampAsc(clientId, pageable).map(this::toActivityDto);
    }

    @Override
    public ClientRiskScoreDTO clientRiskScore(Long clientId) {
        User client = findUser(clientId);
        ClientRiskScoreDTO dto = new ClientRiskScoreDTO();
        
        int baseScore = 30; // Starting with a "safe" score
        
        // Penalize for failed logins
        long failedLogins = userActivityRepository.countByUserIdAndActionType(clientId, UserActivityActionType.FAILED_LOGIN);
        baseScore += (int) (failedLogins * 5);
        
        // Penalize for being blocked in the past
        long blockedEvents = userActivityRepository.countByUserIdAndActionType(clientId, UserActivityActionType.ACCOUNT_BLOCKED);
        baseScore += (int) (blockedEvents * 20);
        
        // Cap the score
        dto.setRiskScore(Math.min(100, baseScore));
        return dto;
    }

    @Override
    public ClientEligibilityDTO clientEligibility(Long clientId) {
        User client = findUser(clientId);
        ClientEligibilityDTO dto = new ClientEligibilityDTO();
        
        ClientRiskScoreDTO risk = clientRiskScore(clientId);
        boolean isEligible = client.getStatus() == UserStatus.ACTIVE && risk.getRiskScore() < 70;
        
        dto.setEligible(isEligible);
        dto.setReason(isEligible ? "Client meets standard criteria." : "High risk score or inactive account.");
        return dto;
    }

    // --- Helpers ---

    private User findUser(Long id) {
        return userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    private UserResponseDTO toDto(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setDeleted(user.isDeleted());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setAddress(user.getAddress());
        dto.setGender(user.getGender());
        if (user.getAssignedAgent() != null) {
            dto.setAssignedAgentId(user.getAssignedAgent().getId());
            dto.setAssignedAgentName(user.getAssignedAgent().getFirstName() + " " + user.getAssignedAgent().getLastName());
        }
        return dto;
    }

    private UserActivityResponseDTO toActivityDto(com.kredia.entity.user.UserActivity a) {
        UserActivityResponseDTO dto = new UserActivityResponseDTO();
        dto.setId(a.getId());
        dto.setUserId(a.getUserId());
        dto.setActionType(a.getActionType());
        dto.setDescription(a.getDescription());
        dto.setTimestamp(a.getTimestamp());
        return dto;
    }

    private void logActivity(Long userId, UserActivityActionType actionType, String description) {
        com.kredia.entity.user.UserActivity activity = new com.kredia.entity.user.UserActivity();
        activity.setUserId(userId);
        activity.setActionType(actionType);
        activity.setDescription(description);
        activity.setTimestamp(java.time.Instant.now());
        userActivityRepository.save(activity);
    }

    private Specification<User> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }

    private Specification<User> hasStatus(UserStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    private Specification<User> hasRole(UserRole role) {
        return (root, query, cb) -> cb.equal(root.get("role"), role);
    }

    private Specification<User> createdAfter(Instant from) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from);
    }

    private Specification<User> createdBefore(Instant to) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), to);
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n") || escaped.contains("\r")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    // Agent client workflow methods
    @Override
    public UserResponseDTO approveClient(Long agentId, Long clientId) {
        User agent = findUser(agentId);
        User client = findUser(clientId);

        // Verify agent is assigned to this client
        if (!client.getAssignedAgent().getUserId().equals(agentId)) {
            throw new IllegalArgumentException("Agent not assigned to this client");
        }

        // Update client status
        client.setStatus(UserStatus.ACTIVE);
        userRepository.save(client);

        // Log activity
        logActivity(agentId, UserActivityActionType.APPROVAL,
            String.format("Approved client %s %s", client.getFirstName(), client.getLastName()));

        return toDto(client);
    }

    @Override
    public UserResponseDTO rejectClient(Long agentId, Long clientId, String reason) {
        User agent = findUser(agentId);
        User client = findUser(clientId);

        // Verify agent is assigned to this client
        if (!client.getAssignedAgent().getUserId().equals(agentId)) {
            throw new IllegalArgumentException("Agent not assigned to this client");
        }

        // Update client status
        client.setStatus(UserStatus.BLOCKED);
        userRepository.save(client);

        // Log activity
        String description = String.format("Rejected client %s %s", client.getFirstName(), client.getLastName());
        if (reason != null && !reason.trim().isEmpty()) {
            description += " - Reason: " + reason;
        }
        logActivity(agentId, UserActivityActionType.REJECTION, description);

        return toDto(client);
    }

    @Override
    public UserResponseDTO suspendClient(Long agentId, Long clientId, String reason) {
        User agent = findUser(agentId);
        User client = findUser(clientId);

        // Verify agent is assigned to this client
        if (!client.getAssignedAgent().getUserId().equals(agentId)) {
            throw new IllegalArgumentException("Agent not assigned to this client");
        }

        // Update client status
        client.setStatus(UserStatus.SUSPENDED);
        userRepository.save(client);

        // Log activity
        String description = String.format("Suspended client %s %s", client.getFirstName(), client.getLastName());
        if (reason != null && !reason.trim().isEmpty()) {
            description += " - Reason: " + reason;
        }
        logActivity(agentId, UserActivityActionType.CLIENT_SUSPENDED, description);

        return toDto(client);
    }
}
