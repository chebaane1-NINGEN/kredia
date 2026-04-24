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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import java.util.List;
import java.util.ArrayList;

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
    CommandLineRunner initData(DataSeederService seederService,
                                SchemaFixer schemaFixer) {
        return args -> {
            try {
                log.info("Checking database for initial data...");
                schemaFixer.fixSchema();
                seederService.runSeeding();
            } catch (Exception e) {
                log.error("Error during data seeding: {}", e.getMessage(), e);
            }
        };
    }

    @Component
    static class DataSeederService {
        private final UserRepository userRepository;
        private final UserActivityRepository userActivityRepository;
        private final PasswordEncoder passwordEncoder;
        private final jakarta.persistence.EntityManager entityManager;

        public DataSeederService(UserRepository userRepository, UserActivityRepository userActivityRepository,
                               PasswordEncoder passwordEncoder, jakarta.persistence.EntityManager entityManager) {
            this.userRepository = userRepository;
            this.userActivityRepository = userActivityRepository;
            this.passwordEncoder = passwordEncoder;
            this.entityManager = entityManager;
        }

        @Transactional
        public void runSeeding() {
            // Force re-seeding to ensure 50+ users and realistic data
            log.info("Starting professional data seeding (50+ users)...");
            
            // Disable FK checks to clear data properly
            entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 0").executeUpdate();
            try {
                // Clear user activities first due to FK
                entityManager.createNativeQuery("DELETE FROM user_activity").executeUpdate();
                // Clear users
                entityManager.createNativeQuery("DELETE FROM user").executeUpdate();
                
                // Reset IDs if possible (optional, but good for clean state)
                try {
                    entityManager.createNativeQuery("ALTER TABLE user AUTO_INCREMENT = 1").executeUpdate();
                    entityManager.createNativeQuery("ALTER TABLE user_activity AUTO_INCREMENT = 1").executeUpdate();
                } catch (Exception e) {
                    log.warn("Could not reset auto-increment: {}", e.getMessage());
                }
            } finally {
                entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 1").executeUpdate();
            }
            
            seedData(userRepository, userActivityRepository, passwordEncoder, entityManager);
        }

        @Transactional
        protected void seedData(UserRepository userRepository, 
                             UserActivityRepository userActivityRepository,
                             PasswordEncoder passwordEncoder,
                             jakarta.persistence.EntityManager entityManager) {
            // Create Fixed Admin
            if (!userRepository.existsByEmailAndDeletedFalse("abidimouhamedali2@gmail.com")) {
                User fixedAdmin = createUser("Abidi", "Mouamed Ali", "abidimouhamedali2@gmail.com", "+21690000000",
                        UserRole.ADMIN, UserStatus.ACTIVE, passwordEncoder, null, "Admin@123");
                User savedFixedAdmin = userRepository.save(fixedAdmin);
                updateCreatedAt(savedFixedAdmin.getId(), 365, entityManager); // Created 1 year ago
                log.info("Created Fixed Admin: {} (ID: {})", savedFixedAdmin.getEmail(), savedFixedAdmin.getId());
                createUserActivities(savedFixedAdmin.getId(), userActivityRepository, UserRole.ADMIN, 365);
            } else {
                log.info("Fixed admin already exists, skipping creation");
            }

            // Create Admin
            User admin = createUser("Admin", "System", "admin@kredia.com", "+21690000001",
                    UserRole.ADMIN, UserStatus.ACTIVE, passwordEncoder, null, "Admin@123");
            User savedAdmin = userRepository.save(admin);
            updateCreatedAt(savedAdmin.getId(), 180, entityManager);
            log.info("Created Admin: {} (ID: {})", savedAdmin.getEmail(), savedAdmin.getId());
            createUserActivities(savedAdmin.getId(), userActivityRepository, UserRole.ADMIN, 180);

            // Create Additional Admins
            String[] adminEmails = {"admin2@kredia.com", "admin3@kredia.com", "admin4@kredia.com", "admin5@kredia.com"};
            for (int i = 0; i < adminEmails.length; i++) {
                User additionalAdmin = createUser("Admin", "User" + (i + 2), adminEmails[i], "+2169000000" + (10 + i),
                        UserRole.ADMIN, UserStatus.ACTIVE, passwordEncoder, null, "Admin@123");
                User savedAdditionalAdmin = userRepository.save(additionalAdmin);
                updateCreatedAt(savedAdditionalAdmin.getId(), 180 - (i + 1), entityManager);
                log.info("Created Additional Admin: {} (ID: {})", savedAdditionalAdmin.getEmail(), savedAdditionalAdmin.getId());
                createUserActivities(savedAdditionalAdmin.getId(), userActivityRepository, UserRole.ADMIN, 180 - (i + 1));
            }

            // Create Primary Agent for testing
            User testAgent = createUser("Test", "Agent", "agent1@kredia.com", "+21691000000",
                    UserRole.AGENT, UserStatus.ACTIVE, passwordEncoder, null, "Agent@123");
            User savedTestAgent = userRepository.save(testAgent);
            updateCreatedAt(savedTestAgent.getId(), 160, entityManager);
            log.info("Created Test Agent: {} (ID: {})", savedTestAgent.getEmail(), savedTestAgent.getId());
            createUserActivities(savedTestAgent.getId(), userActivityRepository, UserRole.AGENT, 160);

            // Create Additional Agents
            String[] agentEmails = {"agent2@kredia.com", "agent3@kredia.com", "agent4@kredia.com", "agent5@kredia.com", "agent6@kredia.com"};
            for (int i = 0; i < agentEmails.length; i++) {
                User additionalAgent = createUser("Agent", "User" + (i + 2), agentEmails[i], "+2169100000" + (10 + i),
                        UserRole.AGENT, UserStatus.ACTIVE, passwordEncoder, null, "Agent@123");
                User savedAdditionalAgent = userRepository.save(additionalAgent);
                updateCreatedAt(savedAdditionalAgent.getId(), 160 - (i + 1), entityManager);
                log.info("Created Additional Agent: {} (ID: {})", savedAdditionalAgent.getEmail(), savedAdditionalAgent.getId());
                createUserActivities(savedAdditionalAgent.getId(), userActivityRepository, UserRole.AGENT, 160 - (i + 1));
            }

            // Create Primary Client for testing
            User testClient = createUser("Test", "Client", "client1@kredia.com", "+21620000000",
                    UserRole.CLIENT, UserStatus.ACTIVE, passwordEncoder, savedTestAgent, "Client@123");
            User savedTestClient = userRepository.save(testClient);
            updateCreatedAt(savedTestClient.getId(), 170, entityManager);
            log.info("Created Test Client: {} (ID: {})", savedTestClient.getEmail(), savedTestClient.getId());
            createUserActivities(savedTestClient.getId(), userActivityRepository, UserRole.CLIENT, 170);

            // Create Additional Clients
            String[] clientEmails = {"client2@kredia.com", "client3@kredia.com", "client4@kredia.com", "client5@kredia.com", 
                                    "client6@kredia.com", "client7@kredia.com", "client8@kredia.com", "client9@kredia.com", "client10@kredia.com", "client11@kredia.com"};
            for (int i = 0; i < clientEmails.length; i++) {
                User additionalClient = createUser("Client", "User" + (i + 2), clientEmails[i], "+2162000000" + (10 + i),
                        UserRole.CLIENT, UserStatus.ACTIVE, passwordEncoder, savedTestAgent, "Client@123");
                User savedAdditionalClient = userRepository.save(additionalClient);
                updateCreatedAt(savedAdditionalClient.getId(), 170 - (i + 1), entityManager);
                log.info("Created Additional Client: {} (ID: {})", savedAdditionalClient.getEmail(), savedAdditionalClient.getId());
                createUserActivities(savedAdditionalClient.getId(), userActivityRepository, UserRole.CLIENT, 170 - (i + 1));
            }

            // Create more Agents
            String[] agentFirstNames = {"Karim", "Samira", "Mehdi", "Ines", "Hassen"};
            String[] agentLastNames = {"Ben Ali", "Trabelsi", "Gharbi", "Bouzid", "Sassi"};
            List<User> agents = new ArrayList<>();
            agents.add(savedTestAgent);
            
            for (int i = 0; i < 5; i++) {
                String fName = agentFirstNames[i];
                String lName = agentLastNames[i];
                String email = fName.toLowerCase() + "." + lName.toLowerCase().replace(" ", "") + "@kredia.com";
                String phone = "+2169100000" + (i + 1);
                String password = "Agent@" + String.format("%03d", i + 1);
                
                User agent = createUser(fName, lName, email, phone, UserRole.AGENT, UserStatus.ACTIVE, passwordEncoder, null, password);
                User savedAgent = userRepository.save(agent);
                updateCreatedAt(savedAgent.getId(), 150 - (i * 10), entityManager);
                log.info("Created Agent: {} (ID: {})", savedAgent.getEmail(), savedAgent.getId());
                createUserActivities(savedAgent.getId(), userActivityRepository, UserRole.AGENT, 150 - (i * 10));
                agents.add(savedAgent);
            }

            // Create Clients
            String[] firstNames = {"Mohamed", "Fatima", "Ahmed", "Nadia", "Ali", "Youssef", "Amina", "Omar", "Sara", "Hedi", "Leila", "Mourad", "Salma", "Amir", "Imen", "Sami", "Mariem", "Tarek", "Rym", "Walid", "Sana", "Khaled", "Hiba", "Riadh", "Nour", "Mehdi", "Ines", "Hassen", "Asma", "Bilel", "Dorra", "Nizar", "Mouna", "Sofiene", "Najwa", "Kamel", "Wafa", "Adel", "Amal", "Nabil", "Zied", "Sonia", "Fares", "Nourane", "Bassem", "Maysa", "Anis", "Olfa", "Raouf", "Ghada"};
            String[] lastNames = {"Hassan", "Zahra", "Bouazizi", "Saidi", "Gharbi", "Trabelsi", "Ben Ali", "Ayari", "Hammami", "Jelassi", "Drissi", "Cherif", "Zribi", "Mabrouk", "Amri", "Baccouche", "Karray", "Abid", "Triki", "Chaabane", "Mzoughi", "Ghannouchi", "Belaid", "Sellami", "Mansour", "Khmiri", "Bouzid", "Sassi", "Toumi", "Jarraya", "Belhadj", "Masmoudi", "Mnif", "Feki", "Louati", "Ghorbel", "Ellouze", "Hachicha", "Daoud", "Rekik"};
            
            Random random = new Random();
            
            for (int i = 0; i < 60; i++) {
                String fName = firstNames[random.nextInt(firstNames.length)];
                String lName = lastNames[random.nextInt(lastNames.length)];
                String email = fName.toLowerCase() + "." + lName.toLowerCase().replace(" ", "") + (i + 1) + "@kredia.com";
                String phone = "+216" + (20000001 + i); // Start from 20000001 to avoid conflict with testClient
                String password = "Client@" + String.format("%03d", i + 1);
                
                UserStatus status;
                int statusRand = random.nextInt(10);
                if (statusRand < 7) status = UserStatus.ACTIVE;
                else if (statusRand < 8) status = UserStatus.INACTIVE;
                else if (statusRand < 9) status = UserStatus.SUSPENDED;
                else status = UserStatus.BLOCKED;

                User assignedAgent = agents.get(random.nextInt(agents.size()));
                
                User client = createUser(fName, lName, email, phone, UserRole.CLIENT, status, passwordEncoder, assignedAgent, password);
                User savedClient = userRepository.save(client);
                
                // Random creation date over the last 6 months
                int daysAgo = random.nextInt(180);
                updateCreatedAt(savedClient.getId(), daysAgo, entityManager);
                
                createUserActivities(savedClient.getId(), userActivityRepository, UserRole.CLIENT, daysAgo);
            }

            log.info("Data seeding completed successfully! Created 5 Admins, 6 Agents, 11 Clients (test accounts) + 5 Agents + 60 Clients (random) = 87 total users.");
        }

        private void updateCreatedAt(Long userId, int daysAgo, jakarta.persistence.EntityManager em) {
            Instant past = Instant.now().minus(daysAgo, ChronoUnit.DAYS);
            em.createNativeQuery("UPDATE `user` SET created_at = :ts WHERE user_id = :id")
              .setParameter("ts", past)
              .setParameter("id", userId)
              .executeUpdate();
        }

        private User createUser(String firstName, String lastName, String email, String phone,
                                UserRole role, UserStatus status, PasswordEncoder encoder,
                                User assignedAgent, String password) {
            User user = new User();
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEmail(email);
            user.setPhoneNumber(phone);
            user.setPasswordHash(encoder.encode(password));
            user.setRole(role);
            user.setStatus(status);
            user.setDeleted(false);
            user.setEmailVerified(status == UserStatus.ACTIVE);
            user.setDateOfBirth(LocalDate.of(1985 + new Random().nextInt(20), 1 + new Random().nextInt(11), 1 + new Random().nextInt(27)));
            user.setGender(new Random().nextBoolean() ? Gender.MALE : Gender.FEMALE);
            user.setAddress(new Random().nextInt(100) + " Avenue Habib Bourguiba, Tunis");
            user.setAssignedAgent(assignedAgent);
            return user;
        }

        private void createUserActivities(Long userId, UserActivityRepository repo, UserRole role, long daysAgoOffset) {
            Instant now = Instant.now().minus(daysAgoOffset, ChronoUnit.DAYS);
            Random random = new Random();

            // CREATED activity
            UserActivity created = new UserActivity();
            created.setUserId(userId);
            created.setActionType(UserActivityActionType.CREATED);
            created.setDescription("Account created via registration");
            created.setTimestamp(now);
            repo.save(created);

            // LOGIN activity (simulated recent logins)
            for (int i = 0; i < 3 + random.nextInt(10); i++) {
                UserActivity login = new UserActivity();
                login.setUserId(userId);
                login.setActionType(UserActivityActionType.LOGIN);
                login.setDescription("User logged in successfully");
                login.setTimestamp(now.plus(random.nextInt(Math.max(1, (int)daysAgoOffset)), ChronoUnit.DAYS));
                repo.save(login);
            }

            if (role == UserRole.AGENT) {
                // Agent activities
                for (int i = 0; i < 5 + random.nextInt(15); i++) {
                    UserActivity action = new UserActivity();
                    action.setUserId(userId);
                    action.setActionType(random.nextBoolean() ? UserActivityActionType.APPROVAL : UserActivityActionType.CLIENT_HANDLED);
                    action.setDescription(action.getActionType() == UserActivityActionType.APPROVAL ? "Approved application #" + (1000 + i) : "Handled client query");
                    action.setTimestamp(now.plus(random.nextInt(Math.max(1, (int)daysAgoOffset)), ChronoUnit.DAYS));
                    repo.save(action);
                }
            }

            if (role == UserRole.CLIENT) {
                // Client activities
                for (int i = 0; i < 2 + random.nextInt(5); i++) {
                    UserActivity action = new UserActivity();
                    action.setUserId(userId);
                    action.setActionType(UserActivityActionType.STATUS_CHANGED);
                    action.setDescription("Client updated profile information");
                    action.setTimestamp(now.plus(random.nextInt(Math.max(1, (int)daysAgoOffset)), ChronoUnit.DAYS));
                    repo.save(action);
                }
            }
        }
    }

    @Component
    static class SchemaFixer {
        @jakarta.persistence.PersistenceContext
        private jakarta.persistence.EntityManager entityManager;

        @org.springframework.transaction.annotation.Transactional
        public void fixSchema() {
            try {
                entityManager.createNativeQuery("ALTER TABLE `user` MODIFY COLUMN `phone` VARCHAR(20) NULL").executeUpdate();
                // Ensure action_type can hold our enum values
                entityManager.createNativeQuery("ALTER TABLE `user_activity` MODIFY COLUMN `action_type` VARCHAR(50) NOT NULL").executeUpdate();
            } catch (Exception e) {
                // Ignore errors if columns don't exist
            }
        }
    }
}
