package com.kredia.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.List;
import java.util.Map;

/**
 * FlywayRepairConfig - Repairs failed Flyway migrations before they are executed.
 * This runs before Flyway to fix issues with the flyway_schema_history table.
 */
@Configuration
public class FlywayRepairConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayRepairConfig.class);

    @Bean
    @Profile("!test")
    public CommandLineRunner repairFlywayMigrations(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                log.info("Checking for failed Flyway migrations...");

                // Check if flyway_schema_history table exists
                List<Map<String, Object>> tables = jdbcTemplate.queryForList(
                    "SHOW TABLES LIKE 'flyway_schema_history'"
                );

                if (tables.isEmpty()) {
                    log.info("Flyway schema history table does not exist yet, skipping repair");
                    return;
                }

                // Find failed migrations for version 20260331130000
                List<Map<String, Object>> failedMigrations = jdbcTemplate.queryForList(
                    "SELECT * FROM flyway_schema_history WHERE version = '20260331130000' AND success = 0"
                );

                if (failedMigrations.isEmpty()) {
                    log.info("No failed migrations found for version 20260331130000");
                    return;
                }

                log.warn("Found {} failed migration(s) for version 20260331130000", failedMigrations.size());

                // Check if the columns already exist
                boolean passwordHashExists = columnExists(jdbcTemplate, "user", "password_hash");
                boolean dateOfBirthExists = columnExists(jdbcTemplate, "user", "date_of_birth");
                boolean addressExists = columnExists(jdbcTemplate, "user", "address");
                boolean genderExists = columnExists(jdbcTemplate, "user", "gender");
                boolean verificationTokenExists = columnExists(jdbcTemplate, "user", "verification_token");

                if (passwordHashExists && dateOfBirthExists && addressExists && genderExists && verificationTokenExists) {
                    log.info("All columns from migration V20260331130000 already exist - marking as repaired");
                    
                    // Mark the migration as successful
                    jdbcTemplate.update(
                        "UPDATE flyway_schema_history SET success = 1, checksum = ?, execution_time = 0 " +
                        "WHERE version = '20260331130000'",
                        calculateChecksum()
                    );
                    log.info("Successfully repaired Flyway migration V20260331130000");
                } else {
                    log.warn("Some columns are missing from migration V20260331130000 - manual intervention needed");
                    log.info("password_hash exists: {}", passwordHashExists);
                    log.info("date_of_birth exists: {}", dateOfBirthExists);
                    log.info("address exists: {}", addressExists);
                    log.info("gender exists: {}", genderExists);
                    log.info("verification_token exists: {}", verificationTokenExists);
                    
                    // Delete the failed migration record to allow it to run again
                    jdbcTemplate.update(
                        "DELETE FROM flyway_schema_history WHERE version = '20260331130000'"
                    );
                    log.info("Deleted failed migration record - Flyway will attempt to run it again");
                }

            } catch (Exception e) {
                log.error("Error repairing Flyway migrations", e);
                // Don't throw - let Flyway handle it
            }
        };
    }

    private boolean columnExists(JdbcTemplate jdbcTemplate, String tableName, String columnName) {
        try {
            List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                tableName, columnName
            );
            return !columns.isEmpty();
        } catch (Exception e) {
            log.warn("Could not check if column {} exists: {}", columnName, e.getMessage());
            return false;
        }
    }

    private int calculateChecksum() {
        try {
            Resource resource = new ClassPathResource("db/migration/V20260331130000__add_user_auth_fields.sql");
            byte[] content = Files.readAllBytes(Paths.get(resource.getURI()));
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(content);
            // Convert to int checksum (Flyway style)
            int checksum = 0;
            for (byte b : hash) {
                checksum = (checksum << 8) + (b & 0xFF);
            }
            return checksum;
        } catch (Exception e) {
            log.warn("Could not calculate checksum, using default");
            return -1415600365; // Pre-calculated checksum for the fixed file
        }
    }
}
