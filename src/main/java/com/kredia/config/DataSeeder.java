package com.kredia.config;

import com.kredia.entity.user.*;
import com.kredia.repository.user.UserActivityRepository;
import com.kredia.repository.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * DataSeeder initializes test data for the User module.
 * Creates: 1 Admin, 2 Agents, 5 Clients with realistic data and UserActivity logs.
 */
@Configuration
@SuppressWarnings("null")
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    @Profile("!test")
    CommandLineRunner initData(UserRepository userRepository,
                                UserActivityRepository userActivityRepository,
                                BCryptPasswordEncoder passwordEncoder) {
        return args -> {
            try {
                // Check if we already have data
                if (userRepository.count() > 0) {
                    log.info("Database already contains {} users, skipping data seeding", userRepository.count());
                    return;
                }

                log.info("Starting data seeding...");
                seedData(userRepository, userActivityRepository, passwordEncoder);
            } catch (Exception e) {
                log.error("Error during data seeding: {}", e.getMessage(), e);
            }
        };
    }

    @Transactional
    private void seedData(UserRepository userRepository, 
                         UserActivityRepository userActivityRepository,
                         BCryptPasswordEncoder passwordEncoder) {
        // Create Admin
        User admin = createUser("Admin", "Kredia", "admin@kredia.com", "+21690000001",
                UserRole.ADMIN, UserStatus.ACTIVE, passwordEncoder, null);
        User savedAdmin = userRepository.save(admin);
        log.info("Created Admin: {} (ID: {})", savedAdmin.getEmail(), savedAdmin.getId());
        createUserActivities(savedAdmin.getId(), userActivityRepository, UserRole.ADMIN);

        // Create Agents
        User agent1 = createUser("Karim", "Ben Ali", "karim.agent@kredia.com", "+21690000002",
                UserRole.AGENT, UserStatus.ACTIVE, passwordEncoder, null);
        User savedAgent1 = userRepository.save(agent1);
        log.info("Created Agent 1: {} (ID: {})", savedAgent1.getEmail(), savedAgent1.getId());
        createUserActivities(savedAgent1.getId(), userActivityRepository, UserRole.AGENT);

        User agent2 = createUser("Samira", "Trabelsi", "samira.agent@kredia.com", "+21690000003",
                UserRole.AGENT, UserStatus.ACTIVE, passwordEncoder, null);
        User savedAgent2 = userRepository.save(agent2);
        log.info("Created Agent 2: {} (ID: {})", savedAgent2.getEmail(), savedAgent2.getId());
        createUserActivities(savedAgent2.getId(), userActivityRepository, UserRole.AGENT);

        // Create Clients
        User client1 = createUser("Mohamed", "Hassan", "mohamed.client@email.com", "+21690000004",
                UserRole.CLIENT, UserStatus.ACTIVE, passwordEncoder, savedAgent1);
        User savedClient1 = userRepository.save(client1);
        log.info("Created Client 1: {} (ID: {}) assigned to Agent {}", 
                savedClient1.getEmail(), savedClient1.getId(), savedAgent1.getId());
        createUserActivities(savedClient1.getId(), userActivityRepository, UserRole.CLIENT);

        User client2 = createUser("Fatima", "Zahra", "fatima.client@email.com", "+21690000005",
                UserRole.CLIENT, UserStatus.ACTIVE, passwordEncoder, savedAgent1);
        User savedClient2 = userRepository.save(client2);
        log.info("Created Client 2: {} (ID: {}) assigned to Agent {}", 
                savedClient2.getEmail(), savedClient2.getId(), savedAgent1.getId());
        createUserActivities(savedClient2.getId(), userActivityRepository, UserRole.CLIENT);

        User client3 = createUser("Ahmed", "Bouazizi", "ahmed.client@email.com", "+21690000006",
                UserRole.CLIENT, UserStatus.PENDING_VERIFICATION, passwordEncoder, savedAgent2);
        User savedClient3 = userRepository.save(client3);
        log.info("Created Client 3: {} (ID: {}) assigned to Agent {}", 
                savedClient3.getEmail(), savedClient3.getId(), savedAgent2.getId());
        createUserActivities(savedClient3.getId(), userActivityRepository, UserRole.CLIENT);

        User client4 = createUser("Nadia", "Saidi", "nadia.client@email.com", "+21690000007",
                UserRole.CLIENT, UserStatus.SUSPENDED, passwordEncoder, null);
        User savedClient4 = userRepository.save(client4);
        log.info("Created Client 4: {} (ID: {}) - SUSPENDED", savedClient4.getEmail(), savedClient4.getId());
        createUserActivities(savedClient4.getId(), userActivityRepository, UserRole.CLIENT);

        User client5 = createUser("Ali", "Gharbi", "ali.client@email.com", "+21690000008",
                UserRole.CLIENT, UserStatus.BLOCKED, passwordEncoder, null);
        User savedClient5 = userRepository.save(client5);
        log.info("Created Client 5: {} (ID: {}) - BLOCKED", savedClient5.getEmail(), savedClient5.getId());
        createUserActivities(savedClient5.getId(), userActivityRepository, UserRole.CLIENT);

        log.info("Data seeding completed successfully!");
        log.info("Summary: 1 Admin, 2 Agents, 5 Clients created");
        log.info("Swagger UI available at: http://localhost:8086/swagger-ui/index.html");
        log.info("Test user credentials:");
        log.info("  Admin: admin@kredia.com / password");
        log.info("  Agent: karim.agent@kredia.com / password");
        log.info("  Client: mohamed.client@email.com / password");
    }

    private User createUser(String firstName, String lastName, String email, String phone,
                            UserRole role, UserStatus status, BCryptPasswordEncoder encoder,
                            User assignedAgent) {
        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPhoneNumber(phone);
        user.setPasswordHash(encoder.encode("password"));
        user.setRole(role);
        user.setStatus(status);
        user.setDeleted(false);
        user.setEmailVerified(status == UserStatus.ACTIVE);
        user.setDateOfBirth(LocalDate.of(1990, 5, 15));
        user.setGender(Gender.MALE);
        user.setAddress("Tunis, Tunisia");
        user.setAssignedAgent(assignedAgent);
        return user;
    }

    private void createUserActivities(Long userId, UserActivityRepository repo, UserRole role) {
        Instant now = Instant.now();

        // CREATED activity
        UserActivity created = new UserActivity();
        created.setUserId(userId);
        created.setActionType(UserActivityActionType.CREATED);
        created.setDescription("User account created during data seeding");
        created.setTimestamp(now.minus(30, ChronoUnit.DAYS));
        repo.save(created);

        // STATUS_CHANGED activity
        UserActivity statusChanged = new UserActivity();
        statusChanged.setUserId(userId);
        statusChanged.setActionType(UserActivityActionType.STATUS_CHANGED);
        statusChanged.setDescription("Status changed to ACTIVE by system");
        statusChanged.setTimestamp(now.minus(29, ChronoUnit.DAYS));
        repo.save(statusChanged);

        if (role == UserRole.AGENT) {
            // Agent-specific activities
            UserActivity approval = new UserActivity();
            approval.setUserId(userId);
            approval.setActionType(UserActivityActionType.APPROVAL);
            approval.setDescription("Approved loan application #1234");
            approval.setTimestamp(now.minus(10, ChronoUnit.DAYS));
            repo.save(approval);

            UserActivity clientHandled = new UserActivity();
            clientHandled.setUserId(userId);
            clientHandled.setActionType(UserActivityActionType.CLIENT_HANDLED);
            clientHandled.setDescription("Handled client request");
            clientHandled.setTimestamp(now.minus(5, ChronoUnit.DAYS));
            repo.save(clientHandled);

            // Processing times
            UserActivity processingStart = new UserActivity();
            processingStart.setUserId(userId);
            processingStart.setActionType(UserActivityActionType.PROCESSING_STARTED);
            processingStart.setDescription("Started processing application #1234");
            processingStart.setTimestamp(now.minus(12, ChronoUnit.DAYS));
            repo.save(processingStart);

            UserActivity processingComplete = new UserActivity();
            processingComplete.setUserId(userId);
            processingComplete.setActionType(UserActivityActionType.PROCESSING_COMPLETED);
            processingComplete.setDescription("Completed processing application #1234");
            processingComplete.setTimestamp(now.minus(11, ChronoUnit.DAYS).minus(30, ChronoUnit.MINUTES));
            repo.save(processingComplete);
        }

        if (role == UserRole.CLIENT) {
            // Client-specific activities
            UserActivity profileUpdate = new UserActivity();
            profileUpdate.setUserId(userId);
            profileUpdate.setActionType(UserActivityActionType.STATUS_CHANGED);
            profileUpdate.setDescription("Client updated profile information");
            profileUpdate.setTimestamp(now.minus(7, ChronoUnit.DAYS));
            repo.save(profileUpdate);
        }

        // Recent activity for all users
        UserActivity recentActivity = new UserActivity();
        recentActivity.setUserId(userId);
        recentActivity.setActionType(UserActivityActionType.STATUS_CHANGED);
        recentActivity.setDescription("Recent user activity recorded");
        recentActivity.setTimestamp(now.minus(1, ChronoUnit.HOURS));
        repo.save(recentActivity);
    }
}
