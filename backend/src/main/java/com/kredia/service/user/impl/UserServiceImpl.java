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
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserActivityRepository userActivityRepository;
    private final EntityManager entityManager;

    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           UserActivityRepository userActivityRepository,
                           EntityManager entityManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userActivityRepository = userActivityRepository;
        this.entityManager = entityManager;
    }

    @Override
    public UserResponseDTO create(Long actorId, UserRequestDTO request) {
        User actor = findUser(actorId);
        if (userRepository.existsByEmailAndDeletedFalse(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        if (userRepository.existsByPhoneNumberAndDeletedFalse(request.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number already in use");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole() != null ? request.getRole() : UserRole.CLIENT);
        user.setStatus(request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE);
        user.setDateOfBirth(request.getDateOfBirth());
        user.setAddress(request.getAddress());
        user.setGender(request.getGender());
        if (request.getPriorityScore() != null) {
            user.setPriorityScore(normalizePriorityScore(request.getPriorityScore()));
        }
        if (request.getPassword() != null) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        if (actor.getRole() == UserRole.AGENT) {
            user.setRole(UserRole.CLIENT);
            user.setAssignedAgent(actor);
            if (request.getStatus() == null) {
                user.setStatus(UserStatus.ACTIVE);
            }
        }

        User savedUser = userRepository.save(user);
        String description = actor.getRole() == UserRole.AGENT
                ? String.format("Client created by agent %s", actor.getEmail())
                : String.format("User created by %s", actor.getEmail());
        if (actor.getRole() == UserRole.AGENT) {
            logAgentClientActivity(actor.getId(), savedUser.getId(), UserActivityActionType.CREATED,
                    description, "-", savedUser.getStatus().name(), "Agent created and assigned client");
        } else {
            logActivity(savedUser.getId(), UserActivityActionType.CREATED, description);
        }
        return toDto(savedUser);
    }

    @Override
    public UserResponseDTO getById(Long actorId, Long id) {
        return toDto(findUser(id));
    }

    @Override
    public Page<UserResponseDTO> search(Long actorId, Optional<String> query, Optional<List<UserStatus>> status,
                                         Optional<List<UserRole>> role, Optional<Instant> createdFrom,
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

        if (status.isPresent() && !status.get().isEmpty()) {
            spec = spec.and((root, q, cb) -> root.get("status").in(status.get()));
        }
        if (role.isPresent() && !role.get().isEmpty()) {
            spec = spec.and((root, q, cb) -> root.get("role").in(role.get()));
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
    public byte[] exportUsersCsv(Long actorId, Optional<String> email, Optional<List<UserStatus>> status,
                                 Optional<List<UserRole>> role, Optional<Instant> createdFrom,
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
    public byte[] exportUsersExcel(Long actorId, Optional<String> email, Optional<List<UserStatus>> status,
                                   Optional<List<UserRole>> role, Optional<Instant> createdFrom,
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
        User actor = findUser(actorId);
        User user = findUser(id);

        if (actor.getRole() == UserRole.AGENT && !actor.getId().equals(id)) {
            if (user.getAssignedAgent() == null || !user.getAssignedAgent().getId().equals(actorId)) {
                throw new IllegalArgumentException("Agent can only update assigned clients");
            }
            if (user.getRole() != UserRole.CLIENT) {
                throw new IllegalArgumentException("Agent cannot modify admins or other agents");
            }
            user.setEmail(payload.getEmail());
            user.setFirstName(payload.getFirstName());
            user.setLastName(payload.getLastName());
            user.setPhoneNumber(payload.getPhoneNumber());
            user.setDateOfBirth(payload.getDateOfBirth());
            user.setAddress(payload.getAddress());
            user.setGender(payload.getGender());
            if (payload.getPriorityScore() != null) {
                user.setPriorityScore(normalizePriorityScore(payload.getPriorityScore()));
            }
            if (payload.getPassword() != null) {
                user.setPasswordHash(passwordEncoder.encode(payload.getPassword()));
            }
        } else {
            user.setEmail(payload.getEmail());
            user.setFirstName(payload.getFirstName());
            user.setLastName(payload.getLastName());
            user.setPhoneNumber(payload.getPhoneNumber());
            if (payload.getRole() != null) user.setRole(payload.getRole());
            if (payload.getStatus() != null) user.setStatus(payload.getStatus());
            user.setDateOfBirth(payload.getDateOfBirth());
            user.setAddress(payload.getAddress());
            user.setGender(payload.getGender());
            if (payload.getPriorityScore() != null) {
                user.setPriorityScore(normalizePriorityScore(payload.getPriorityScore()));
            }
            if (payload.getPassword() != null) {
                user.setPasswordHash(passwordEncoder.encode(payload.getPassword()));
            }
        }

        User savedUser = userRepository.save(user);
        if (actor.getRole() == UserRole.AGENT) {
            logAgentClientActivity(actorId, savedUser.getId(), UserActivityActionType.CLIENT_HANDLED,
                    String.format("Updated client profile %s %s", savedUser.getFirstName(), savedUser.getLastName()),
                    "profile-before-update", "profile-after-update", "Agent edited client profile");
        }
        return toDto(savedUser);
    }

    @Override
    public void changePassword(Long actorId, Long id, String currentPassword, String newPassword) {
        User actor = findUser(actorId);
        User user = findUser(id);
        boolean changingOwnPassword = actor.getId().equals(id);
        if (!changingOwnPassword && actor.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only admins can change another user's password");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters");
        }
        if (changingOwnPassword && (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash()))) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        logActivity(actorId, UserActivityActionType.PASSWORD_RESET_COMPLETED,
                changingOwnPassword ? "Password changed from profile" : "Password changed by administrator for userId=" + id);
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
        User actor = findUser(actorId);
        if (actor.getRole() == UserRole.AGENT) {
            throw new IllegalArgumentException("Agents are not permitted to delete clients");
        }
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
        long totalUsers = userRepository.countByDeletedFalse();
        long totalClients = userRepository.countByRoleAndDeletedFalse(UserRole.CLIENT);
        long totalAgents = userRepository.countByRoleAndDeletedFalse(UserRole.AGENT);
        long activeUsers = userRepository.countByStatusAndDeletedFalse(UserStatus.ACTIVE);
        long blockedUsers = userRepository.countByStatusAndDeletedFalse(UserStatus.BLOCKED);
        long suspendedUsers = userRepository.countByStatusAndDeletedFalse(UserStatus.SUSPENDED);
        long last24hRegistrations = userRepository.countByCreatedAtAfterAndDeletedFalse(Instant.now().minus(1, java.time.temporal.ChronoUnit.DAYS));
        long approvalCount = userActivityRepository.countByActionType(UserActivityActionType.APPROVAL);
        long rejectionCount = userActivityRepository.countByActionType(UserActivityActionType.REJECTION);

        dto.setTotalUser(totalUsers);
        dto.setTotalClient(totalClients);
        dto.setTotalAgent(totalAgents);
        dto.setActiveUser(activeUsers);
        dto.setBlockedUser(blockedUsers);
        dto.setSuspendedUser(suspendedUsers);
        dto.setApprovalCount(approvalCount);
        dto.setRejectionCount(rejectionCount);
        dto.setLast24hRegistrations(last24hRegistrations);

        dto.setRoleDistribution(Map.of(
            UserRole.ADMIN, userRepository.countByRoleAndDeletedFalse(UserRole.ADMIN),
            UserRole.AGENT, totalAgents,
            UserRole.CLIENT, totalClients
        ));

        var monthlyRegistrations = userRepository.countRegistrationsByMonth();
        var registrationEvolution = new java.util.LinkedHashMap<String, Long>();
        for (Object[] row : monthlyRegistrations) {
            registrationEvolution.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }
        dto.setRegistrationEvolution(registrationEvolution);

        dto.setSystemHealthIndex(totalUsers > 0 ? Math.min(100.0, Math.max(0.0, (activeUsers / (double) totalUsers) * 100.0)) : 0.0);

        var recentActivities = userActivityRepository.findTop10ByOrderByTimestampDesc();
        dto.setRecentActivities(recentActivities.stream().map(this::toActivityDto).collect(java.util.stream.Collectors.toList()));

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
        
        // Build dynamic query based on filters
        var queryBuilder = new StringBuilder();
        var params = new HashMap<String, Object>();
        
        queryBuilder.append("SELECT u FROM User u WHERE u.role = :role AND u.deleted = false AND u.assignedAgent = :agent");
        params.put("role", UserRole.CLIENT);
        params.put("agent", agent);
        
        // Email filter
        if (email.isPresent() && !email.get().trim().isEmpty()) {
            queryBuilder.append(" AND (LOWER(u.email) LIKE LOWER(:email) OR LOWER(u.firstName) LIKE LOWER(:email) OR LOWER(u.lastName) LIKE LOWER(:email) OR LOWER(u.phoneNumber) LIKE LOWER(:email))");
            params.put("email", "%" + email.get().trim() + "%");
        }
        
        // Status filter
        if (status.isPresent()) {
            queryBuilder.append(" AND u.status = :status");
            params.put("status", status.get());
        }
        
        queryBuilder.append(" ORDER BY u.createdAt DESC");
        
        var query = entityManager.createQuery(queryBuilder.toString(), User.class);
        params.forEach(query::setParameter);
        
        // Apply pagination
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());
        
        List<User> clients = query.getResultList();
        
        // Count query
        var countQueryBuilder = new StringBuilder();
        countQueryBuilder.append("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.deleted = false AND u.assignedAgent = :agent");
        if (email.isPresent() && !email.get().trim().isEmpty()) {
            countQueryBuilder.append(" AND (LOWER(u.email) LIKE LOWER(:email) OR LOWER(u.firstName) LIKE LOWER(:email) OR LOWER(u.lastName) LIKE LOWER(:email) OR LOWER(u.phoneNumber) LIKE LOWER(:email))");
        }
        if (status.isPresent()) {
            countQueryBuilder.append(" AND u.status = :status");
        }
        
        var countQuery = entityManager.createQuery(countQueryBuilder.toString(), Long.class);
        params.forEach(countQuery::setParameter);
        long total = countQuery.getSingleResult();
        
        return new PageImpl<>(clients, pageable, total).map(this::toDto);
    }

    @Override
    public Page<EnhancedClientDTO> agentClientsEnhanced(Long actorId, Optional<String> email, Optional<List<UserStatus>> statuses, Optional<List<String>> priorities, Optional<Instant> startDate, Optional<Instant> endDate, Pageable pageable) {
        User agent = findUser(actorId);
        
        // Build dynamic query based on filters
        // NOTE: Agents can see ALL clients in the system for portfolio management
        var queryBuilder = new StringBuilder();
        var params = new HashMap<String, Object>();
        
        queryBuilder.append("SELECT u FROM User u WHERE u.role = :role AND u.deleted = false");
        params.put("role", UserRole.CLIENT);
        
        // Email filter
        if (email.isPresent() && !email.get().trim().isEmpty()) {
            queryBuilder.append(" AND (LOWER(u.email) LIKE LOWER(:email) OR LOWER(u.firstName) LIKE LOWER(:email) OR LOWER(u.lastName) LIKE LOWER(:email) OR LOWER(u.phoneNumber) LIKE LOWER(:email))");
            params.put("email", "%" + email.get().trim() + "%");
        }
        
        // Status filter
        if (statuses.isPresent() && !statuses.get().isEmpty()) {
            queryBuilder.append(" AND u.status IN :statuses");
            params.put("statuses", statuses.get());
        }
        
        // Date range filter
        if (startDate.isPresent()) {
            queryBuilder.append(" AND u.createdAt >= :startDate");
            params.put("startDate", startDate.get());
        }
        if (endDate.isPresent()) {
            queryBuilder.append(" AND u.createdAt <= :endDate");
            params.put("endDate", endDate.get());
        }
        
        // Priority filter (based on priorityScore)
        if (priorities.isPresent() && !priorities.get().isEmpty()) {
            var priorityConditions = new ArrayList<String>();
            for (String priority : priorities.get()) {
                switch (priority.toUpperCase()) {
                    case "HIGH":
                        priorityConditions.add("u.priorityScore >= 80");
                        break;
                    case "MEDIUM":
                        priorityConditions.add("u.priorityScore >= 50 AND u.priorityScore < 80");
                        break;
                    case "LOW":
                        priorityConditions.add("(u.priorityScore < 50 OR u.priorityScore IS NULL)");
                        break;
                }
            }
            if (!priorityConditions.isEmpty()) {
                queryBuilder.append(" AND (").append(String.join(" OR ", priorityConditions)).append(")");
            }
        }
        pageable.getSort().stream().findFirst().ifPresent(order -> {
            String property = switch (order.getProperty()) {
                case "firstName", "email", "status", "createdAt", "updatedAt", "priorityScore" -> order.getProperty();
                default -> "priorityScore";
            };
            queryBuilder.append(" ORDER BY u.").append(property).append(order.isAscending() ? " ASC" : " DESC");
        });
        
        var query = entityManager.createQuery(queryBuilder.toString(), User.class);
        params.forEach(query::setParameter);
        
        // Apply pagination
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());
        
        var clients = query.getResultList();
        
        // Count query for total elements (matching the main query without pagination)
        var countQueryBuilder = new StringBuilder("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.deleted = false");
        if (email.isPresent() && !email.get().trim().isEmpty()) {
            countQueryBuilder.append(" AND (LOWER(u.email) LIKE LOWER(:email) OR LOWER(u.firstName) LIKE LOWER(:email) OR LOWER(u.lastName) LIKE LOWER(:email) OR LOWER(u.phoneNumber) LIKE LOWER(:email))");
        }
        if (statuses.isPresent() && !statuses.get().isEmpty()) {
            countQueryBuilder.append(" AND u.status IN :statuses");
        }
        if (startDate.isPresent()) {
            countQueryBuilder.append(" AND u.createdAt >= :startDate");
        }
        if (endDate.isPresent()) {
            countQueryBuilder.append(" AND u.createdAt <= :endDate");
        }
        if (priorities.isPresent() && !priorities.get().isEmpty()) {
            var priorityConditions = new ArrayList<String>();
            for (String priority : priorities.get()) {
                switch (priority.toUpperCase()) {
                    case "HIGH":
                        priorityConditions.add("u.priorityScore >= 80");
                        break;
                    case "MEDIUM":
                        priorityConditions.add("u.priorityScore >= 50 AND u.priorityScore < 80");
                        break;
                    case "LOW":
                        priorityConditions.add("(u.priorityScore < 50 OR u.priorityScore IS NULL)");
                        break;
                }
            }
            if (!priorityConditions.isEmpty()) {
                countQueryBuilder.append(" AND (").append(String.join(" OR ", priorityConditions)).append(")");
            }
        }
        
        var countQuery = entityManager.createQuery(countQueryBuilder.toString(), Long.class);
        params.forEach(countQuery::setParameter);
        var total = countQuery.getSingleResult();
        
        // Convert to DTOs
        var clientDTOs = clients.stream()
                .map(client -> this.toEnhancedClientDto(client, agent))
                .collect(Collectors.toList());
        
        return new PageImpl<>(clientDTOs, pageable, total);
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
    public AgentDashboard agentDashboard(Long agentId) {
        User agent = findUser(agentId);
        AgentDashboard dashboard = new AgentDashboard(agentId, agent.getFirstName() + " " + agent.getLastName());

        // Calculate core metrics
        calculateCoreMetrics(dashboard, agentId);

        // Calculate SLA metrics
        calculateSLAMetrics(dashboard, agentId);

        // Calculate risk metrics
        calculateRiskMetrics(dashboard, agent);

        // Calculate priority metrics
        calculatePriorityMetrics(dashboard, agent);

        // Build trend data
        dashboard.setWeeklyTrend(buildWeeklyPerformanceTrend(agentId));
        dashboard.setMonthlyTrend(buildMonthlyPerformanceTrend(agentId));

        // Build recent activities
        dashboard.setRecentActivities(buildRecentActivities(agentId));

        // Generate insights and recommendations
        generateInsightsAndRecommendations(dashboard);

        return dashboard;
    }

    @Override
    public AgentPerformanceDTO agentPerformance(Long agentId) {
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

        // Performance Score Calculation: (Approvals / Total Decisions) * 100
        double score = 0;
        long totalDecisions = approvals + rejections;
        if (totalDecisions > 0) {
            score = Math.round((approvals * 100.0) / totalDecisions * 100.0) / 100.0;
        }
        dto.setPerformanceScore(score);

        // Average Processing Time: Based on actual activity timestamps
        double avgProcessingTime = calculateAverageProcessingTime(agentId, totalActions);
        dto.setAverageProcessingTimeSeconds(avgProcessingTime);

        // Add detailed explanations
        dto.setScoreFormula("Performance Score = (Approvals ÷ Total Decisions) × 100\n" +
                          "Where Total Decisions = Approvals + Rejections\n" +
                          "Current: (" + approvals + " ÷ " + totalDecisions + ") × 100 = " + String.format("%.2f", score) + "%");

        dto.setProcessingTimeFormula("Average Processing Time = Total Time Spent ÷ Total Actions\n" +
                                   "Calculated from activity timestamps in the system");

        // Additional metrics for transparency
        dto.setApprovalRate(totalDecisions > 0 ? Math.round((approvals * 100.0) / totalDecisions * 100.0) / 100.0 : 0);
        dto.setRejectionRate(totalDecisions > 0 ? Math.round((rejections * 100.0) / totalDecisions * 100.0) / 100.0 : 0);

        return dto;
    }

    @Override
    public EnhancedAgentPerformanceDTO agentPerformanceEnhanced(Long agentId) {
        User agent = findUser(agentId);

        long approvals = userActivityRepository.countByUserIdAndActionType(agentId, UserActivityActionType.APPROVAL);
        long rejections = userActivityRepository.countByUserIdAndActionType(agentId, UserActivityActionType.REJECTION);
        long totalActions = userActivityRepository.countByUserId(agentId);
        long clientsHandled = userActivityRepository.countByUserIdAndActionType(agentId, UserActivityActionType.CLIENT_HANDLED);

        long totalDecisions = approvals + rejections;
        double approvalRate = totalDecisions > 0
                ? Math.round((approvals * 100.0 / totalDecisions) * 100.0) / 100.0
                : 0;

        double avgProcessingTime = calculateAverageProcessingTime(agentId, totalActions);

        List<User> clients = userRepository.findAllByAssignedAgentAndRoleAndDeletedFalse(agent, UserRole.CLIENT);
        long pendingClients = clients.stream()
                .filter(c -> c.getStatus() == UserStatus.PENDING_VERIFICATION || c.getStatus() == UserStatus.INACTIVE)
                .count();
        double timeScore = avgProcessingTime <= 0 ? 0 : Math.max(0, Math.min(100, 100 - ((avgProcessingTime / 7200.0) * 100)));
        double outputScore = clients.isEmpty() ? 0 : Math.min(100, (clientsHandled * 100.0 / Math.max(clients.size(), 1)));
        double efficiencyScore = Math.round(((timeScore * 0.60) + (outputScore * 0.40)) * 100.0) / 100.0;
        double volumeScore = Math.min(100, clientsHandled * 10.0);
        double performanceScore = Math.round(((approvalRate * 0.50) + (efficiencyScore * 0.30) + (volumeScore * 0.20)) * 100.0) / 100.0;

        EnhancedAgentPerformanceDTO dto = new EnhancedAgentPerformanceDTO(
                performanceScore,
                approvalRate,
                totalActions,
                approvals,
                rejections,
                clientsHandled,
                avgProcessingTime
        );

        dto.setPendingClients(pendingClients);
        dto.setEfficiencyScore(efficiencyScore);
        dto.setWeeklyTrend(buildWeeklyTrend(agentId));
        dto.setMonthlyTrend(buildMonthlyTrend(agentId));
        dto.setApprovalTrend(buildApprovalTrend(agentId));
        dto.setScoreChangeFromLastWeek(calculateWeeklyScoreChange(agentId));
        dto.setApprovalRateChangeFromLastWeek(calculateWeeklyApprovalChange(agentId));
        dto.setProcessingTimeChangeFromLastWeek(calculateWeeklyProcessingTimeChange(agentId));
        dto.setCalculationWindow("Last 30 days for processing time; current totals from all recorded agent workflow actions.");
        dto.setScoreFormula("Performance Score = approval rate x 0.50 + efficiency score x 0.30 + handling volume score x 0.20");
        dto.setApprovalRateFormula("Approval Rate = approvals / (approvals + rejections) x 100");
        dto.setEfficiencyFormula("Efficiency Score = processing time score x 0.60 + output score x 0.40");
        dto.setDataSources(List.of(
                "user_activity rows owned by agentId=" + agentId,
                "assigned CLIENT users in the user table",
                "APPROVAL, REJECTION, CLIENT_HANDLED, PROCESSING_STARTED and PROCESSING_COMPLETED actions"
        ));
        dto.updatePerformanceStatus();

        generateInsights(dto);

        return dto;
    }

    private double calculateAverageProcessingTime(Long agentId, long totalActions) {
        if (totalActions == 0) {
            return 0;
        }

        Instant startWindow = Instant.now().minus(30, ChronoUnit.DAYS);
        List<UserActivity> activities = userActivityRepository.findByUserIdAndTimestampBetweenOrderByTimestampAsc(agentId, startWindow, Instant.now());

        Instant currentStart = null;
        long totalSeconds = 0;
        long pairs = 0;

        for (UserActivity activity : activities) {
            if (activity.getActionType() == UserActivityActionType.PROCESSING_STARTED) {
                currentStart = activity.getTimestamp();
            } else if (activity.getActionType() == UserActivityActionType.PROCESSING_COMPLETED && currentStart != null) {
                totalSeconds += Duration.between(currentStart, activity.getTimestamp()).getSeconds();
                pairs++;
                currentStart = null;
            }
        }

        if (pairs > 0) {
            return Math.round((totalSeconds / (double) pairs) * 100.0) / 100.0;
        }
        return 1800.0;
    }

    private List<EnhancedAgentPerformanceDTO.PerformanceTrendPoint> buildWeeklyTrend(Long agentId) {
        List<EnhancedAgentPerformanceDTO.PerformanceTrendPoint> trend = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");

        for (int offset = 6; offset >= 0; offset--) {
            LocalDate day = LocalDate.now().minusDays(offset);
            Instant dayStart = day.atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
            Instant dayEnd = day.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).minusNanos(1).toInstant();

            long dailyApprovals = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.APPROVAL, dayStart, dayEnd);
            long dailyRejections = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.REJECTION, dayStart, dayEnd);
            long dailyActions = userActivityRepository.countByUserIdAndTimestampBetween(agentId, dayStart, dayEnd);

            double dailyScore = 0;
            long decisions = dailyApprovals + dailyRejections;
            if (decisions > 0) {
                dailyScore = Math.round((dailyApprovals * 100.0 / decisions) * 100.0) / 100.0;
            }

            trend.add(new EnhancedAgentPerformanceDTO.PerformanceTrendPoint(day.format(formatter), dailyScore, dailyActions, dailyApprovals));
        }
        return trend;
    }

    private List<EnhancedAgentPerformanceDTO.PerformanceTrendPoint> buildMonthlyTrend(Long agentId) {
        List<EnhancedAgentPerformanceDTO.PerformanceTrendPoint> trend = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");
        LocalDate today = LocalDate.now();

        for (int week = 4; week >= 1; week--) {
            LocalDate end = today.minusWeeks(week - 1).plusDays(1);
            LocalDate start = end.minusWeeks(1);
            Instant periodStart = start.atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
            Instant periodEnd = end.atStartOfDay(java.time.ZoneOffset.UTC).minusNanos(1).toInstant();

            long weeklyApprovals = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.APPROVAL, periodStart, periodEnd);
            long weeklyRejections = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.REJECTION, periodStart, periodEnd);
            long weeklyActions = userActivityRepository.countByUserIdAndTimestampBetween(agentId, periodStart, periodEnd);

            double weeklyScore = 0;
            long decisions = weeklyApprovals + weeklyRejections;
            if (decisions > 0) {
                weeklyScore = Math.round((weeklyApprovals * 100.0 / decisions) * 100.0) / 100.0;
            }

            trend.add(new EnhancedAgentPerformanceDTO.PerformanceTrendPoint(start.format(formatter) + " - " + end.minusDays(1).format(formatter), weeklyScore, weeklyActions, weeklyApprovals));
        }
        return trend;
    }

    private List<EnhancedAgentPerformanceDTO.ApprovalTrendPoint> buildApprovalTrend(Long agentId) {
        List<EnhancedAgentPerformanceDTO.ApprovalTrendPoint> trend = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE");

        for (int offset = 6; offset >= 0; offset--) {
            LocalDate day = LocalDate.now().minusDays(offset);
            Instant start = day.atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
            Instant end = day.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).minusNanos(1).toInstant();

            long dailyApprovals = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.APPROVAL, start, end);
            long dailyRejections = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.REJECTION, start, end);

            trend.add(new EnhancedAgentPerformanceDTO.ApprovalTrendPoint(day.format(formatter), dailyApprovals, dailyRejections));
        }

        return trend;
    }

    private double calculateWeeklyScoreChange(Long agentId) {
        Instant today = Instant.now();
        Instant lastWeekStart = today.minus(14, ChronoUnit.DAYS);
        Instant lastWeekMiddle = today.minus(7, ChronoUnit.DAYS);

        long currentApprovals = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.APPROVAL, lastWeekMiddle, today);
        long currentRejections = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.REJECTION, lastWeekMiddle, today);
        long previousApprovals = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.APPROVAL, lastWeekStart, lastWeekMiddle);
        long previousRejections = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.REJECTION, lastWeekStart, lastWeekMiddle);

        double currentScore = 0;
        double previousScore = 0;
        if (currentApprovals + currentRejections > 0) {
            currentScore = (currentApprovals * 100.0) / (currentApprovals + currentRejections);
        }
        if (previousApprovals + previousRejections > 0) {
            previousScore = (previousApprovals * 100.0) / (previousApprovals + previousRejections);
        }
        return Math.round((currentScore - previousScore) * 100.0) / 100.0;
    }

    private double calculateWeeklyApprovalChange(Long agentId) {
        Instant today = Instant.now();
        Instant lastWeekStart = today.minus(14, ChronoUnit.DAYS);
        Instant lastWeekMiddle = today.minus(7, ChronoUnit.DAYS);

        long currentApprovals = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.APPROVAL, lastWeekMiddle, today);
        long previousApprovals = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(agentId, UserActivityActionType.APPROVAL, lastWeekStart, lastWeekMiddle);

        if (previousApprovals == 0) {
            return currentApprovals > 0 ? currentApprovals : 0;
        }
        return Math.round(((currentApprovals - previousApprovals) / (double) Math.max(previousApprovals, 1)) * 100.0 * 100.0) / 100.0;
    }

    private double calculateWeeklyProcessingTimeChange(Long agentId) {
        Instant today = Instant.now();
        Instant lastWeekStart = today.minus(14, ChronoUnit.DAYS);
        Instant lastWeekMiddle = today.minus(7, ChronoUnit.DAYS);

        double currentAvg = calculateAverageProcessingTime(agentId, userActivityRepository.countByUserIdAndTimestampBetween(agentId, lastWeekMiddle, today));
        double previousAvg = calculateAverageProcessingTime(agentId, userActivityRepository.countByUserIdAndTimestampBetween(agentId, lastWeekStart, lastWeekMiddle));
        return Math.round((previousAvg == 0 ? 0 : currentAvg - previousAvg) * 100.0) / 100.0;
    }

    /**
     * Generate AI-driven insights based on performance metrics
     */
    private void generateInsights(EnhancedAgentPerformanceDTO performance) {
        List<String> insights = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        if (performance.getPerformanceScore() >= 90) {
            insights.add("🌟 Excellent performance! You're among the top performers. Keep up this momentum!");
        } else if (performance.getPerformanceScore() >= 75) {
            insights.add("✨ Good performance. Consider reviewing rejection cases to optimize further.");
        } else if (performance.getPerformanceScore() >= 60) {
            insights.add("📈 Average performance. Focus on improving approval quality and consistency.");
        } else {
            insights.add("⚠️ Performance needs attention. Review your approval criteria and process.");
            recommendations.add("Review rejected cases and prioritize pending clients with high priority scores.");
        }

        if (performance.getApprovals() > 0) {
            if (performance.getApprovalRate() > 80) {
                insights.add("📊 High approval rate (" + (long)performance.getApprovalRate() + "%). Maintain quality checks.");
            } else if (performance.getApprovalRate() < 50) {
                insights.add("🔍 Low approval rate. Consider additional training or process review.");
                recommendations.add("Audit the last rejection reasons and validate whether documentation gaps can be resolved before rejection.");
            }
        }

        if (performance.getPendingClients() > 5) {
            insights.add("📋 You have " + performance.getPendingClients() + " pending clients. Consider prioritization.");
            recommendations.add("Work the oldest pending clients first, then sort by priority score.");
        } else if (performance.getPendingClients() > 0) {
            insights.add("💼 Current workload is manageable. Focus on quality.");
        }

        if (performance.getEfficiencyScore() > 0.5) {
            insights.add("⚡ Excellent efficiency score. Optimize further!");
        }

        if (performance.getTotalActions() == 0) {
            insights.add("📉 No activity detected. Start taking actions to build performance data.");
            recommendations.add("Create or update a client record to start the activity trail.");
        } else if (performance.getTotalActions() > 20) {
            insights.add("🎯 Strong activity level. Maintain consistency.");
        }

        performance.setInsights(insights);
        performance.setRecommendations(recommendations);
    }

    // ==================== Agent Dashboard Implementation ====================

    private void calculateCoreMetrics(AgentDashboard dashboard, Long agentId) {
        // Get basic activity counts
        long approvals = userActivityRepository.countByUserIdAndActionType(agentId, UserActivityActionType.APPROVAL);
        long rejections = userActivityRepository.countByUserIdAndActionType(agentId, UserActivityActionType.REJECTION);
        long totalActions = userActivityRepository.countByUserId(agentId);
        long clientsHandled = userActivityRepository.countByUserIdAndActionType(agentId, UserActivityActionType.CLIENT_HANDLED);

        // Calculate approval rate
        long totalDecisions = approvals + rejections;
        double approvalRate = totalDecisions > 0 ? (approvals * 100.0 / totalDecisions) : 0.0;

        // Calculate average processing time
        double avgProcessingTime = calculateAverageProcessingTime(agentId, totalActions);

        // Set core metrics
        dashboard.setApprovals(approvals);
        dashboard.setRejections(rejections);
        dashboard.setTotalActions(totalActions);
        dashboard.setClientsHandled(clientsHandled);
        dashboard.setApprovalRate(approvalRate);
        dashboard.setAverageProcessingTime(avgProcessingTime);

        // Calculate derived metrics
        dashboard.calculateEfficiencyScore();
        dashboard.calculatePerformanceScore();

        // Get pending clients
        User agent = findUser(agentId);
        List<User> clients = userRepository.findAllByAssignedAgentAndRoleAndDeletedFalse(agent, UserRole.CLIENT);
        long pendingClients = clients.stream()
                .filter(c -> c.getStatus() == UserStatus.ACTIVE || c.getStatus() == UserStatus.PENDING_VERIFICATION)
                .count();
        dashboard.setPendingClients(pendingClients);
    }

    private void calculateSLAMetrics(AgentDashboard dashboard, Long agentId) {
        // SLA target: 2 hours (7200 seconds) for processing
        double slaTargetSeconds = 7200.0;

        // Get activities from last 30 days for SLA calculation
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        List<UserActivity> recentActivities = userActivityRepository.findByUserIdAndTimestampBetweenOrderByTimestampAsc(
                agentId, thirtyDaysAgo, Instant.now());

        long compliantActions = 0;
        long totalSLAActions = 0;
        double totalResponseTime = 0;

        // Calculate SLA compliance based on processing time pairs
        Instant currentStart = null;
        for (UserActivity activity : recentActivities) {
            if (activity.getActionType() == UserActivityActionType.PROCESSING_STARTED) {
                currentStart = activity.getTimestamp();
            } else if (activity.getActionType() == UserActivityActionType.PROCESSING_COMPLETED && currentStart != null) {
                double responseTime = Duration.between(currentStart, activity.getTimestamp()).getSeconds();
                totalResponseTime += responseTime;
                totalSLAActions++;

                if (responseTime <= slaTargetSeconds) {
                    compliantActions++;
                }
                currentStart = null;
            }
        }

        double complianceRate = totalSLAActions > 0 ? (compliantActions * 100.0 / totalSLAActions) : 100.0;
        double averageResponseTime = totalSLAActions > 0 ? totalResponseTime / totalSLAActions : 0;

        AgentDashboard.SLAMetrics slaMetrics = new AgentDashboard.SLAMetrics(
                complianceRate, totalSLAActions, compliantActions,
                totalSLAActions - compliantActions, averageResponseTime, slaTargetSeconds);

        dashboard.setSlaMetrics(slaMetrics);
        dashboard.updateSLAStatus();
    }

    private void calculateRiskMetrics(AgentDashboard dashboard, User agent) {
        List<User> clients = userRepository.findAllByAssignedAgentAndRoleAndDeletedFalse(agent, UserRole.CLIENT);

        if (clients.isEmpty()) {
            dashboard.setRiskMetrics(new AgentDashboard.RiskMetrics(0, 0, 0, 0, 0));
            return;
        }

        long highRisk = 0, mediumRisk = 0, lowRisk = 0;
        double totalRiskScore = 0;

        for (User client : clients) {
            ClientRiskScoreDTO riskScore = clientRiskScore(client.getId());
            double score = riskScore.getRiskScore();

            totalRiskScore += score;

            if (score >= 80) highRisk++;
            else if (score >= 60) mediumRisk++;
            else lowRisk++;
        }

        double averageRiskScore = totalRiskScore / clients.size();

        // Calculate risk distribution index (measure of concentration)
        double riskDistributionIndex = 0;
        if (clients.size() > 1) {
            double expectedEqual = clients.size() / 3.0;
            double variance = Math.pow(highRisk - expectedEqual, 2) +
                            Math.pow(mediumRisk - expectedEqual, 2) +
                            Math.pow(lowRisk - expectedEqual, 2);
            riskDistributionIndex = Math.sqrt(variance / clients.size()) * 100;
        }

        AgentDashboard.RiskMetrics riskMetrics = new AgentDashboard.RiskMetrics(
                averageRiskScore, highRisk, mediumRisk, lowRisk, riskDistributionIndex);

        dashboard.setRiskMetrics(riskMetrics);
    }

    private void calculatePriorityMetrics(AgentDashboard dashboard, User agent) {
        List<User> clients = userRepository.findAllByAssignedAgentAndRoleAndDeletedFalse(agent, UserRole.CLIENT);

        long urgent = 0, high = 0, medium = 0, low = 0;
        long totalPriorityActions = 0, urgentHandled = 0;

        for (User client : clients) {
            Integer priorityScore = calculatePriorityScore(client, agent);

            if (priorityScore >= 90) urgent++;
            else if (priorityScore >= 75) high++;
            else if (priorityScore >= 50) medium++;
            else low++;

            // Check if urgent clients were handled quickly
            if (priorityScore >= 90) {
                List<UserActivity> clientActivities = userActivityRepository.findByUserIdAndTimestampBetweenOrderByTimestampAsc(
                        client.getId(), Instant.now().minus(7, ChronoUnit.DAYS), Instant.now());

                boolean handled = clientActivities.stream()
                        .anyMatch(a -> a.getActionType() == UserActivityActionType.APPROVAL ||
                                     a.getActionType() == UserActivityActionType.REJECTION);

                if (handled) {
                    urgentHandled++;
                    totalPriorityActions++;
                }
            }
        }

        double priorityHandlingEfficiency = urgent > 0 ? (urgentHandled * 100.0 / urgent) : 100.0;

        AgentDashboard.PriorityMetrics priorityMetrics = new AgentDashboard.PriorityMetrics(
                urgent, high, medium, low, priorityHandlingEfficiency);

        dashboard.setPriorityMetrics(priorityMetrics);
    }

    private List<AgentDashboard.PerformanceTrendPoint> buildWeeklyPerformanceTrend(Long agentId) {
        List<AgentDashboard.PerformanceTrendPoint> trend = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");

        for (int offset = 6; offset >= 0; offset--) {
            LocalDate day = LocalDate.now().minusDays(offset);
            Instant dayStart = day.atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
            Instant dayEnd = day.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).minusNanos(1).toInstant();

            long dailyApprovals = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(
                    agentId, UserActivityActionType.APPROVAL, dayStart, dayEnd);
            long dailyRejections = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(
                    agentId, UserActivityActionType.REJECTION, dayStart, dayEnd);
            long dailyActions = userActivityRepository.countByUserIdAndTimestampBetween(agentId, dayStart, dayEnd);

            double dailyApprovalRate = 0;
            long decisions = dailyApprovals + dailyRejections;
            if (decisions > 0) {
                dailyApprovalRate = (dailyApprovals * 100.0 / decisions);
            }

            // Calculate daily performance score using the same formula
            double dailyPerformanceScore = 0;
            if (decisions > 0) {
                double approvalComponent = dailyApprovalRate * 0.5;
                double speedComponent = 30.0; // Simplified for trend
                double volumeComponent = Math.min(20.0, dailyActions * 0.1);
                dailyPerformanceScore = approvalComponent + speedComponent + volumeComponent;
            }

            trend.add(new AgentDashboard.PerformanceTrendPoint(
                    day.format(formatter),
                    Math.round(dailyPerformanceScore * 100.0) / 100.0,
                    dailyActions,
                    dailyApprovals,
                    Math.round(dailyApprovalRate * 100.0) / 100.0));
        }

        return trend;
    }

    private List<AgentDashboard.PerformanceTrendPoint> buildMonthlyPerformanceTrend(Long agentId) {
        List<AgentDashboard.PerformanceTrendPoint> trend = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int offset = 5; offset >= 0; offset--) {
            LocalDate month = LocalDate.now().minusMonths(offset);
            LocalDate startOfMonth = month.withDayOfMonth(1);
            LocalDate endOfMonth = month.withDayOfMonth(month.lengthOfMonth());

            Instant monthStart = startOfMonth.atStartOfDay(java.time.ZoneOffset.UTC).toInstant();
            Instant monthEnd = endOfMonth.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC).minusNanos(1).toInstant();

            long monthlyApprovals = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(
                    agentId, UserActivityActionType.APPROVAL, monthStart, monthEnd);
            long monthlyRejections = userActivityRepository.countByUserIdAndActionTypeAndTimestampBetween(
                    agentId, UserActivityActionType.REJECTION, monthStart, monthEnd);
            long monthlyActions = userActivityRepository.countByUserIdAndTimestampBetween(agentId, monthStart, monthEnd);

            double monthlyApprovalRate = 0;
            long decisions = monthlyApprovals + monthlyRejections;
            if (decisions > 0) {
                monthlyApprovalRate = (monthlyApprovals * 100.0 / decisions);
            }

            double monthlyPerformanceScore = 0;
            if (decisions > 0) {
                double approvalComponent = monthlyApprovalRate * 0.5;
                double speedComponent = 30.0;
                double volumeComponent = Math.min(20.0, monthlyActions * 0.1);
                monthlyPerformanceScore = approvalComponent + speedComponent + volumeComponent;
            }

            trend.add(new AgentDashboard.PerformanceTrendPoint(
                    month.format(formatter),
                    Math.round(monthlyPerformanceScore * 100.0) / 100.0,
                    monthlyActions,
                    monthlyApprovals,
                    Math.round(monthlyApprovalRate * 100.0) / 100.0));
        }

        return trend;
    }

    private List<AgentDashboard.ActivityGroup> buildRecentActivities(Long agentId) {
        List<AgentDashboard.ActivityGroup> activityGroups = new ArrayList<>();

        // Get activities from last 7 days
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<UserActivity> activities = userActivityRepository.findByUserIdAndTimestampBetweenOrderByTimestampAsc(
                agentId, weekAgo, Instant.now());

        // Group by date
        Map<String, List<UserActivity>> groupedByDate = activities.stream()
                .collect(Collectors.groupingBy(
                        activity -> activity.getTimestamp().atZone(java.time.ZoneOffset.UTC)
                                .toLocalDate().toString(),
                        Collectors.toList()));

        // Convert to ActivityGroups
        for (Map.Entry<String, List<UserActivity>> entry : groupedByDate.entrySet()) {
            List<AgentDashboard.ActivityItem> activityItems = entry.getValue().stream()
                    .map(this::toActivityItem)
                    .collect(Collectors.toList());

            AgentDashboard.ActivityGroup group = new AgentDashboard.ActivityGroup(
                    entry.getKey(), activityItems, activityItems.size());

            activityGroups.add(group);
        }

        // Sort by date descending
        activityGroups.sort((a, b) -> b.getDate().compareTo(a.getDate()));

        return activityGroups;
    }

    private AgentDashboard.ActivityItem toActivityItem(UserActivity activity) {
        String impact = determineActivityImpact(activity.getActionType());
        String status = "SUCCESS"; // Default status

        return new AgentDashboard.ActivityItem(
                activity.getId(),
                activity.getActionType().toString(),
                activity.getDescription(),
                activity.getTimestamp(),
                null, // clientName - would need additional query
                null, // clientId
                impact,
                status
        );
    }

    private String determineActivityImpact(UserActivityActionType actionType) {
        switch (actionType) {
            case APPROVAL:
            case REJECTION:
                return "HIGH";
            case CLIENT_HANDLED:
            case PROCESSING_COMPLETED:
                return "MEDIUM";
            default:
                return "LOW";
        }
    }

    private void generateInsightsAndRecommendations(AgentDashboard dashboard) {
        List<String> insights = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        // Performance insights
        if (dashboard.getPerformanceScore() >= 80) {
            insights.add("🎉 Excellent performance! You're in the top tier.");
        } else if (dashboard.getPerformanceScore() >= 60) {
            insights.add("👍 Good performance. Keep up the momentum!");
        } else {
            insights.add("⚠️ Performance needs improvement. Focus on key metrics.");
        }

        // Approval rate insights
        if (dashboard.getApprovalRate() > 80) {
            insights.add("📈 High approval rate indicates efficient processing.");
            recommendations.add("Maintain quality control while sustaining approval rates.");
        } else if (dashboard.getApprovalRate() < 50) {
            insights.add("🔍 Lower approval rate may indicate conservative decision-making.");
            recommendations.add("Review approval criteria and consider additional training.");
        }

        // SLA insights
        if (dashboard.getSlaMetrics() != null) {
            if (dashboard.getSlaMetrics().getComplianceRate() >= 95) {
                insights.add("⏱️ Outstanding SLA compliance!");
            } else if (dashboard.getSlaMetrics().getComplianceRate() < 85) {
                insights.add("⏰ SLA compliance needs attention.");
                recommendations.add("Focus on reducing processing times for better SLA performance.");
            }
        }

        // Risk insights
        if (dashboard.getRiskMetrics() != null) {
            if (dashboard.getRiskMetrics().getHighRiskClients() > 0) {
                insights.add("🚨 " + dashboard.getRiskMetrics().getHighRiskClients() + " high-risk clients require attention.");
                recommendations.add("Prioritize review of high-risk client applications.");
            }
        }

        // Priority insights
        if (dashboard.getPriorityMetrics() != null) {
            if (dashboard.getPriorityMetrics().getUrgentClients() > 0) {
                insights.add("🔥 " + dashboard.getPriorityMetrics().getUrgentClients() + " urgent clients pending.");
                recommendations.add("Address urgent client cases immediately.");
            }
        }

        // Workload insights
        if (dashboard.getPendingClients() > 10) {
            insights.add("📋 High workload detected.");
            recommendations.add("Consider workload distribution or additional support.");
        }

        dashboard.setInsights(insights);
        dashboard.setRecommendations(recommendations);
    }

    @Override
    public Page<UserActivityResponseDTO> agentActivityEnhanced(Long agentId, List<UserActivityActionType> actionTypes,
                                                              Long clientId, Instant fromDate, Instant toDate,
                                                              String searchTerm, Pageable pageable) {
        // Build dynamic query based on filters
        Specification<UserActivity> spec = Specification.where(null);

        // Always filter by agent
        spec = spec.and((root, query, cb) -> cb.equal(root.get("userId"), agentId));

        // Filter by action types
        if (actionTypes != null && !actionTypes.isEmpty()) {
            spec = spec.and((root, query, cb) -> root.get("actionType").in(actionTypes));
        }

        // Filter by client context while keeping ownership on the agent's activity stream.
        if (clientId != null) {
            String marker = "clientId=" + clientId;
            spec = spec.and((root, query, cb) -> cb.like(root.get("description"), "%" + marker + "%"));
        }

        // Filter by date range
        if (fromDate != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("timestamp"), fromDate));
        }
        if (toDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("timestamp"), toDate));
        }

        // Filter by search term in description
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            spec = spec.and((root, query, cb) ->
                cb.like(cb.lower(root.get("description")), "%" + searchTerm.toLowerCase() + "%"));
        }

        return userActivityRepository.findAll(spec, pageable).map(this::toActivityDto);
    }

    @Override
    public List<UserActivityResponseDTO> agentActivityRealtime(Long agentId, Instant since) {
        List<UserActivity> activities = userActivityRepository.findByUserIdAndTimestampAfterOrderByTimestampDesc(agentId, since);
        return activities.stream().map(this::toActivityDto).collect(Collectors.toList());
    }

    @Override
    public Page<UserActivityResponseDTO> agentActivity(Long agentId, Pageable pageable) {
        return userActivityRepository.findByUserIdOrderByTimestampAsc(agentId, pageable).map(this::toActivityDto);
    }

    @Override
    public Page<UserActivityResponseDTO> agentActivityForClients(Long agentId, Pageable pageable) {
        // Get all clients assigned to this agent
        User agent = findUser(agentId);
        List<User> assignedClients = userRepository.findAllByAssignedAgentAndRoleAndDeletedFalse(agent, UserRole.CLIENT);
        
        if (assignedClients.isEmpty()) {
            return Page.empty(pageable);
        }
        
        Set<Long> clientIds = assignedClients.stream().map(User::getId).collect(Collectors.toSet());
        clientIds.add(agentId); // Include agent's own activities
        
        // Get activities for agent and all their clients
        return userActivityRepository.findByUserIdInOrderByTimestampAsc(clientIds, pageable).map(this::toActivityDto);
    }

    @Override
    public UserResponseDTO clientProfile(Long actorId, Long clientId) {
        User actor = findUser(actorId);
        User client = findUser(clientId);

        if (actor.getRole() == UserRole.AGENT) {
            if (client.getAssignedAgent() == null || !client.getAssignedAgent().getId().equals(actorId)) {
                throw new IllegalArgumentException("Agent can only view profiles for assigned clients");
            }
        }
        return toDto(client);
    }

    @Override
    public ClientDetailsDTO agentClientDetails(Long agentId, Long clientId) {
        User agent = findUser(agentId);
        if (agent.getRole() != UserRole.AGENT) {
            throw new IllegalArgumentException("Only agents can access agent client details");
        }

        User client = findUser(clientId);
        if (client.getAssignedAgent() == null || !client.getAssignedAgent().getId().equals(agentId)) {
            throw new IllegalArgumentException("Agent not assigned to this client");
        }

        ClientDetailsDTO dto = new ClientDetailsDTO();
        dto.setId(client.getId());
        dto.setEmail(client.getEmail());
        dto.setFirstName(client.getFirstName());
        dto.setLastName(client.getLastName());
        dto.setPhoneNumber(client.getPhoneNumber());
        dto.setRole(client.getRole());
        dto.setStatus(client.getStatus());
        dto.setCreatedAt(client.getCreatedAt());
        dto.setUpdatedAt(client.getUpdatedAt());
        dto.setDateOfBirth(client.getDateOfBirth());
        dto.setAddress(client.getAddress());
        dto.setGender(client.getGender());
        if (client.getAssignedAgent() != null) {
            dto.setAssignedAgentId(client.getAssignedAgent().getId());
            dto.setAssignedAgentName(client.getAssignedAgent().getFirstName() + " " + client.getAssignedAgent().getLastName());
        }
        dto.setLastInteraction(calculateLastInteraction(client));
        dto.setPriorityScore(calculatePriorityScore(client, agent));
        dto.setActivities(userActivityRepository.findByUserIdOrderByTimestampAsc(client.getId()).stream().map(this::toActivityDto).collect(Collectors.toList()));
        dto.setRiskScore(clientRiskScore(clientId).getRiskScore());
        dto.setEligibility(clientEligibility(clientId).getReason());

        return dto;
    }

    @Override
    public Page<UserActivityResponseDTO> clientActivity(Long actorId, Long clientId, String actionType, Pageable pageable) {
        User actor = findUser(actorId);
        User client = findUser(clientId);

        if (actor.getRole() == UserRole.AGENT) {
            if (client.getAssignedAgent() == null || !client.getAssignedAgent().getId().equals(actorId)) {
                throw new IllegalArgumentException("Agent can only view activity for assigned clients");
            }
        }

        if (actionType == null || actionType.isBlank()) {
            return userActivityRepository.findByUserIdOrderByTimestampAsc(clientId, pageable).map(this::toActivityDto);
        }

        UserActivityActionType filterType;
        try {
            filterType = UserActivityActionType.valueOf(actionType.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid activity type: " + actionType);
        }

        return userActivityRepository.findByFilters(null, filterType, clientId, null, null, pageable).map(this::toActivityDto);
    }

    @Override
    public ClientRiskScoreDTO clientRiskScore(Long clientId) {
        User client = findUser(clientId);
        ClientRiskScoreDTO dto = new ClientRiskScoreDTO();
        
        // ==================== NEW FORMULA ====================
        // Base score: 50 points
        int baseScore = 50;
        dto.setBaseScore(baseScore);
        dto.addToBreakdown("BASE_SCORE", baseScore);
        
        int totalScore = baseScore;
        
        // Bonus: +10 if status is ACTIVE
        int statusBonus = 0;
        if (client.getStatus() == UserStatus.ACTIVE) {
            statusBonus = 10;
            totalScore += statusBonus;
        }
        dto.setStatusBonus(statusBonus);
        dto.addToBreakdown("STATUS_BONUS_ACTIVE", statusBonus);
        
        // Penalty: -20 for past suspensions (count suspension events)
        long suspensionCount = userActivityRepository.countByUserIdAndActionType(clientId, UserActivityActionType.CLIENT_SUSPENDED);
        if (client.getStatus() == UserStatus.SUSPENDED) {
            suspensionCount++; // Add current suspension if applicable
        }
        int suspensionPenalty = (int) (suspensionCount * -20);
        totalScore += suspensionPenalty;
        dto.setSuspensionPenalty(suspensionPenalty);
        dto.addToBreakdown("SUSPENSION_PENALTY", suspensionPenalty);
        dto.addToBreakdown("SUSPENSION_COUNT", (int) suspensionCount);
        
        // Activity bonus: +2 per recorded action (count total activities)
        long totalActivityCount = userActivityRepository.countByUserId(clientId);
        int activityBonus = (int) (totalActivityCount * 2);
        totalScore += activityBonus;
        dto.setActivityBonus(activityBonus);
        dto.addToBreakdown("ACTIVITY_BONUS", activityBonus);
        dto.addToBreakdown("ACTIVITY_COUNT", (int) totalActivityCount);
        
        // Seniority bonus: +1 per 30 days since account creation
        java.time.Instant createdAt = client.getCreatedAt();
        if (createdAt != null) {
            long daysSinceCreation = java.time.temporal.ChronoUnit.DAYS.between(
                createdAt.atZone(java.time.ZoneId.systemDefault()).toLocalDate(),
                java.time.LocalDate.now()
            );
            int seniorityBonus = (int) (daysSinceCreation / 30); // 1 point per 30 days
            totalScore += seniorityBonus;
            dto.setSeniorityBonus(seniorityBonus);
            dto.addToBreakdown("SENIORITY_BONUS", seniorityBonus);
            dto.addToBreakdown("DAYS_SINCE_CREATION", (int) daysSinceCreation);
        }
        
        // Cap the score between 0 and 100
        int finalScore = Math.max(0, Math.min(100, totalScore));
        dto.setRiskScore(finalScore);
        dto.addToBreakdown("FINAL_SCORE", finalScore);
        
        return dto;
    }

    @Override
    public ClientEligibilityDTO clientEligibility(Long clientId) {
        User client = findUser(clientId);
        ClientEligibilityDTO dto = new ClientEligibilityDTO();
        
        ClientRiskScoreDTO risk = clientRiskScore(clientId);
        
        // Eligibility rule: score >= 60 AND status == ACTIVE
        boolean isActive = client.getStatus() == UserStatus.ACTIVE;
        boolean meetScore = risk.getRiskScore() >= 60;
        boolean isEligible = meetScore && isActive;
        
        dto.setEligible(isEligible);
        dto.setCurrentScore(risk.getRiskScore());
        dto.setActive(isActive);
        
        // Build detailed reason
        if (isEligible) {
            dto.setReason("✓ Eligible: Account is ACTIVE and score is " + risk.getRiskScore() + "/100 (≥60)");
            dto.setStatusReason("Status: " + client.getStatus());
        } else {
            StringBuilder reason = new StringBuilder("✗ Not eligible: ");
            if (!isActive) {
                reason.append("Account status is ").append(client.getStatus()).append(" (must be ACTIVE)");
                dto.setStatusReason("Status: " + client.getStatus());
                if (!meetScore) {
                    reason.append(" AND ");
                }
            }
            if (!meetScore) {
                reason.append("Score is ").append(risk.getRiskScore()).append("/100 (below 60 threshold)");
            }
            dto.setReason(reason.toString());
        }
        
        return dto;
    }

    @Override
    public List<ScoreHistoryPointDTO> clientScoreHistory(Long clientId, int days) {
        User client = findUser(clientId);
        if (days <= 0) {
            days = 90;
        }

        Instant now = Instant.now();
        Instant start = now.minus(days, ChronoUnit.DAYS);
        ClientRiskScoreDTO currentRisk = clientRiskScore(clientId);
        int points = Math.min(10, Math.max(4, days / 15));
        long intervalSeconds = Math.max(1, Duration.between(start, now).getSeconds() / (points - 1));

        List<ScoreHistoryPointDTO> history = new ArrayList<>();
        for (int index = 0; index < points; index++) {
            Instant windowStart = start.plusSeconds(intervalSeconds * index);
            Instant windowEnd = index == points - 1 ? now : windowStart.plusSeconds(intervalSeconds);
            long activityCount = userActivityRepository.countByUserIdAndTimestampBetween(clientId, windowStart, windowEnd);
            int scoreOffset = (int) Math.max(0, activityCount * 2 - (points - 1 - index));
            int score = Math.max(0, Math.min(100, currentRisk.getRiskScore() - ((points - 1 - index) * 2) + scoreOffset));

            ScoreHistoryPointDTO point = new ScoreHistoryPointDTO();
            point.setTimestamp(windowEnd.toString());
            point.setScore(score);
            point.setBaseScore(currentRisk.getBaseScore());
            point.setStatusBonus(currentRisk.getStatusBonus());
            point.setSuspensionPenalty(currentRisk.getSuspensionPenalty());
            point.setActivityBonus(currentRisk.getActivityBonus());
            point.setSeniorityBonus(currentRisk.getSeniorityBonus());
            point.setReason("Trend estimate for the period ending " + windowEnd.toString());
            history.add(point);
        }

        return history;
    }

    @Override
    public FinancialMetricsDTO clientFinancialMetrics(Long clientId) {
        User client = findUser(clientId);
        ClientRiskScoreDTO risk = clientRiskScore(clientId);
        List<UserActivity> activities = userActivityRepository.findByUserIdOrderByTimestampAsc(clientId);

        Instant now = Instant.now();
        int totalActivityCount = activities.size();
        int accountAgeMonths = 0;
        if (client.getCreatedAt() != null) {
            accountAgeMonths = (int) ChronoUnit.MONTHS.between(
                    client.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate(),
                    LocalDate.now()
            );
        }

        int daysSinceLastActivity = 90;
        if (!activities.isEmpty()) {
            Instant lastActivity = activities.get(activities.size() - 1).getTimestamp();
            daysSinceLastActivity = (int) Math.min(90, ChronoUnit.DAYS.between(lastActivity.atZone(java.time.ZoneId.systemDefault()).toLocalDate(), LocalDate.now()));
        }

        String riskLevel = risk.getRiskScore() >= 80 ? "LOW"
                : risk.getRiskScore() >= 60 ? "MEDIUM"
                : risk.getRiskScore() >= 40 ? "HIGH"
                : "CRITICAL";

        String activityLevel = totalActivityCount >= 20 ? "HIGH"
                : totalActivityCount >= 5 ? "MODERATE"
                : "LOW";

        int accountHealth = Math.max(0, Math.min(100,
                40 + (risk.getRiskScore() - 50) + Math.min(20, accountAgeMonths) + Math.min(20, totalActivityCount) - Math.min(25, daysSinceLastActivity / 2)
        ));

        FinancialMetricsDTO metrics = new FinancialMetricsDTO();
        metrics.setAccountHealth(accountHealth);
        metrics.setRiskLevel(riskLevel);
        metrics.setActivityLevel(activityLevel);
        metrics.setAccountAgeMonths(accountAgeMonths);
        metrics.setDaysSinceLastActivity(daysSinceLastActivity);
        metrics.setTotalActivityCount(totalActivityCount);
        return metrics;
    }

    @Override
    public List<SmartAlertDTO> clientAlerts(Long clientId) {
        User client = findUser(clientId);
        ClientRiskScoreDTO risk = clientRiskScore(clientId);
        ClientEligibilityDTO eligibility = clientEligibility(clientId);

        List<SmartAlertDTO> alerts = new ArrayList<>();

        if (!eligibility.isEligible()) {
            SmartAlertDTO alert = new SmartAlertDTO();
            alert.setAlertId(UUID.randomUUID().toString());
            alert.setTitle("Eligibility alert");
            alert.setMessage(eligibility.getReason());
            alert.setSeverity(risk.getRiskScore() >= 60 ? "WARNING" : "DANGER");
            alert.setType("ELIGIBILITY_CHANGE");
            alert.setTimestamp(Instant.now().toString());
            alert.setActionUrl("/support/eligibility-help");
            alert.setDismissed(false);
            alerts.add(alert);
        }

        if (client.getStatus() != UserStatus.ACTIVE) {
            SmartAlertDTO statusAlert = new SmartAlertDTO();
            statusAlert.setAlertId(UUID.randomUUID().toString());
            statusAlert.setTitle("Status update");
            statusAlert.setMessage("Your account status is " + client.getStatus() + ". Review any required action.");
            statusAlert.setSeverity("INFO");
            statusAlert.setType("STATUS_CHANGE");
            statusAlert.setTimestamp(Instant.now().toString());
            statusAlert.setActionUrl("/profile/status");
            statusAlert.setDismissed(false);
            alerts.add(statusAlert);
        }

        if (alerts.isEmpty()) {
            SmartAlertDTO defaultAlert = new SmartAlertDTO();
            defaultAlert.setAlertId(UUID.randomUUID().toString());
            defaultAlert.setTitle("No current alerts");
            defaultAlert.setMessage("Your account is in good standing.");
            defaultAlert.setSeverity("INFO");
            defaultAlert.setType("SCORE_CHANGE");
            defaultAlert.setTimestamp(Instant.now().toString());
            defaultAlert.setDismissed(false);
            alerts.add(defaultAlert);
        }

        return alerts;
    }

    @Override
    public List<AIInsightDTO> clientInsights(Long clientId) {
        User client = findUser(clientId);
        ClientRiskScoreDTO risk = clientRiskScore(clientId);
        FinancialMetricsDTO metrics = clientFinancialMetrics(clientId);

        List<AIInsightDTO> insights = new ArrayList<>();

        AIInsightDTO scoreInsight = new AIInsightDTO();
        scoreInsight.setInsightId(UUID.randomUUID().toString());
        scoreInsight.setCategory("SCORE_DRIVER");
        scoreInsight.setTitle("Score performance summary");
        scoreInsight.setMessage("Your financial score is " + risk.getRiskScore() + ". Continue maintaining good activity.");
        scoreInsight.setConfidence(85);
        scoreInsight.setActionable(true);
        scoreInsight.setSuggestedAction(risk.getRiskScore() >= 60 ? "Keep your account activity steady." : "Increase activity and review your profile details.");
        insights.add(scoreInsight);

        AIInsightDTO activityInsight = new AIInsightDTO();
        activityInsight.setInsightId(UUID.randomUUID().toString());
        activityInsight.setCategory("BEHAVIOR");
        activityInsight.setTitle("Activity insight");
        activityInsight.setMessage(totalActivityCountDescription(metrics.getTotalActivityCount()));
        activityInsight.setConfidence(75);
        activityInsight.setActionable(true);
        activityInsight.setSuggestedAction(metrics.getTotalActivityCount() < 5 ? "Perform more actions to build your history." : "Keep up your current activity level." );
        insights.add(activityInsight);

        return insights;
    }

    private String totalActivityCountDescription(int totalActivityCount) {
        if (totalActivityCount >= 20) {
            return "You have a strong activity history with " + totalActivityCount + " recorded actions.";
        }
        if (totalActivityCount >= 5) {
            return "Your activity history is moderate with " + totalActivityCount + " recorded actions.";
        }
        return "Your activity history is limited with only " + totalActivityCount + " actions recorded.";
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
        dto.setPriorityScore(user.getPriorityScore());
        if (user.getAssignedAgent() != null) {
            dto.setAssignedAgentId(user.getAssignedAgent().getId());
            dto.setAssignedAgentName(user.getAssignedAgent().getFirstName() + " " + user.getAssignedAgent().getLastName());
        }
        return dto;
    }

    private EnhancedClientDTO toEnhancedClientDto(User user, User agent) {
        EnhancedClientDTO dto = new EnhancedClientDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setAddress(user.getAddress());
        dto.setGender(user.getGender());
        if (user.getAssignedAgent() != null) {
            dto.setAssignedAgentId(user.getAssignedAgent().getId());
            dto.setAssignedAgentName(user.getAssignedAgent().getFirstName() + " " + user.getAssignedAgent().getLastName());
        }
        
        // Calculate last interaction timestamp
        Instant lastInteraction = calculateLastInteraction(user);
        dto.setLastInteraction(lastInteraction);
        
        // Calculate priority score
        Integer priorityScore = calculatePriorityScore(user, agent);
        dto.setPriorityScore(priorityScore);
        
        return dto;
    }

    private Instant calculateLastInteraction(User client) {
        // Get the most recent activity for this client
        List<UserActivity> activities = userActivityRepository.findByUserIdOrderByTimestampAsc(client.getId());
        if (activities.isEmpty()) {
            return client.getUpdatedAt();
        }
        return activities.get(activities.size() - 1).getTimestamp();
    }

    private Integer calculatePriorityScore(User client, User agent) {
        int score = client.getPriorityScore() > 0 ? client.getPriorityScore() : 50; // Base score
        
        // Status bonus: ACTIVE clients get higher priority
        if (client.getStatus() == UserStatus.ACTIVE) {
            score += 20;
        } else if (client.getStatus() == UserStatus.INACTIVE) {
            score += 10;
        } else if (client.getStatus() == UserStatus.SUSPENDED) {
            score -= 10;
        } else if (client.getStatus() == UserStatus.BLOCKED) {
            score -= 30;
        }
        
        // Recency bonus: More recent interactions = higher priority
        Instant lastInteraction = calculateLastInteraction(client);
        Instant now = Instant.now();
        long daysSinceInteraction = java.time.temporal.ChronoUnit.DAYS.between(lastInteraction, now);
        
        if (daysSinceInteraction <= 7) {
            score += 15;
        } else if (daysSinceInteraction <= 30) {
            score += 10;
        } else if (daysSinceInteraction <= 90) {
            score += 5;
        } else {
            score -= 10;
        }
        
        // Ensure score is within bounds
        return Math.max(0, Math.min(100, score));
    }

    private int normalizePriorityScore(Integer score) {
        if (score == null) {
            return 0;
        }
        return Math.max(0, Math.min(100, score));
    }

    private UserActivityResponseDTO toActivityDto(com.kredia.entity.user.UserActivity a) {
        UserActivityResponseDTO dto = new UserActivityResponseDTO();
        dto.setId(a.getId());
        dto.setUserId(a.getUserId());
        dto.setActionType(a.getActionType());
        dto.setDescription(a.getDescription());
        dto.setTimestamp(a.getTimestamp());
        enrichActivityContext(dto);
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

    private void logAgentClientActivity(Long agentId, Long clientId, UserActivityActionType actionType,
                                        String summary, String previousValue, String newValue, String context) {
        String description = String.format(
                "%s | clientId=%d | previous=%s | new=%s | context=%s",
                summary,
                clientId,
                previousValue != null ? previousValue : "-",
                newValue != null ? newValue : "-",
                context != null ? context : "-"
        );
        logActivity(agentId, actionType, description);
        logActivity(clientId, actionType, description);
    }

    private void enrichActivityContext(UserActivityResponseDTO dto) {
        String description = dto.getDescription();
        if (description == null) {
            return;
        }
        dto.setClientId(extractLong(description, "clientId="));
        dto.setPreviousValue(extractText(description, "previous="));
        dto.setNewValue(extractText(description, "new="));
        dto.setContext(extractText(description, "context="));
        if (dto.getClientId() != null) {
            userRepository.findById(dto.getClientId()).ifPresent(client ->
                    dto.setClientName((client.getFirstName() + " " + client.getLastName()).trim()));
        }
    }

    private Long extractLong(String value, String marker) {
        String text = extractText(value, marker);
        if (text == null || text.isBlank() || "-".equals(text)) {
            return null;
        }
        try {
            return Long.parseLong(text);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String extractText(String value, String marker) {
        int start = value.indexOf(marker);
        if (start < 0) {
            return null;
        }
        start += marker.length();
        int end = value.indexOf(" | ", start);
        return (end >= 0 ? value.substring(start, end) : value.substring(start)).trim();
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
        if (client.getAssignedAgent() == null || !client.getAssignedAgent().getUserId().equals(agentId)) {
            throw new IllegalArgumentException("Agent not assigned to this client");
        }

        // Update client status
        UserStatus previousStatus = client.getStatus();
        client.setStatus(UserStatus.ACTIVE);
        userRepository.save(client);

        logAgentClientActivity(agentId, clientId, UserActivityActionType.APPROVAL,
            String.format("Approved client %s %s", client.getFirstName(), client.getLastName()),
            previousStatus.name(), client.getStatus().name(), "Agent approval workflow");

        return toDto(client);
    }

    @Override
    public UserResponseDTO rejectClient(Long agentId, Long clientId, String reason) {
        User agent = findUser(agentId);
        User client = findUser(clientId);

        // Verify agent is assigned to this client
        if (client.getAssignedAgent() == null || !client.getAssignedAgent().getUserId().equals(agentId)) {
            throw new IllegalArgumentException("Agent not assigned to this client");
        }

        // Update client status
        UserStatus previousStatus = client.getStatus();
        client.setStatus(UserStatus.BLOCKED);
        userRepository.save(client);

        String description = String.format("Rejected client %s %s", client.getFirstName(), client.getLastName());
        if (reason != null && !reason.trim().isEmpty()) {
            description += " - Reason: " + reason;
        }
        logAgentClientActivity(agentId, clientId, UserActivityActionType.REJECTION, description,
                previousStatus.name(), client.getStatus().name(), reason);

        return toDto(client);
    }

    @Override
    public UserResponseDTO suspendClient(Long agentId, Long clientId, String reason) {
        User agent = findUser(agentId);
        User client = findUser(clientId);

        // Verify agent is assigned to this client
        if (client.getAssignedAgent() == null || !client.getAssignedAgent().getUserId().equals(agentId)) {
            throw new IllegalArgumentException("Agent not assigned to this client");
        }

        // Update client status
        UserStatus previousStatus = client.getStatus();
        client.setStatus(UserStatus.SUSPENDED);
        userRepository.save(client);

        String description = String.format("Suspended client %s %s", client.getFirstName(), client.getLastName());
        if (reason != null && !reason.trim().isEmpty()) {
            description += " - Reason: " + reason;
        }
        logAgentClientActivity(agentId, clientId, UserActivityActionType.CLIENT_SUSPENDED, description,
                previousStatus.name(), client.getStatus().name(), reason);

        return toDto(client);
    }
}
