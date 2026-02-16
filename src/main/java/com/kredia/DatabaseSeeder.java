package com.kredia;

import com.kredia.common.Role;
import com.kredia.common.UserStatus;
import com.kredia.entity.credit.Credit;
import com.kredia.entity.wallet.Wallet;
import com.kredia.enums.CreditStatus;
import com.kredia.enums.RiskLevel;
import com.kredia.repository.CreditRepository;
import com.kredia.repository.WalletRepository;
import com.kredia.user.entity.User;
import com.kredia.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class DatabaseSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CreditRepository creditRepository;
    private final WalletRepository walletRepository;

    @Bean
    public CommandLineRunner initDatabase() {
        return args -> {
            // Seed ADMIN
            User admin = seedUser("admin@kredia.com", "+33000000000", "admin123",
                    Role.ADMIN, UserStatus.VERIFIED, "Admin", "Kredia");

            // Seed CLIENT (KYC verified for full access)
            User client = seedUser("client@kredia.com", "+33111111111", "client123",
                    Role.CLIENT, UserStatus.VERIFIED, "Ahmed", "Benali");

            // Seed AGENT
            User agent = seedUser("agent@kredia.com", "+33222222222", "agent123",
                    Role.AGENT, UserStatus.VERIFIED, "Sara", "Mansouri");

            // Seed sample data for client
            if (client != null && creditRepository.countByUserUserId(client.getUserId()) == 0) {
                seedSampleCredit(client, agent);
                seedSampleWallet(client);
                System.out.println("Sample data seeded for client");
            }
        };
    }

    private User seedUser(String email, String phone, String password,
                          Role role, UserStatus status, String firstName, String lastName) {
        if (userRepository.findByEmail(email).isPresent()) {
            System.out.println("User already exists: " + email);
            return userRepository.findByEmail(email).get();
        }

        User user = new User();
        user.setEmail(email);
        user.setPhoneNumber(phone);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setStatus(status);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setCreatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);
        System.out.println(role.name() + " user seeded: " + email);
        return saved;
    }

    private void seedSampleCredit(User client, User agent) {
        Credit credit = new Credit();
        credit.setUser(client);
        credit.setAmount(5000f);
        credit.setInterestRate(8.5f);
        credit.setTermMonths(12);
        credit.setStartDate(LocalDate.now());
        credit.setEndDate(LocalDate.now().plusMonths(12));
        credit.setStatus(CreditStatus.APPROVED);
        credit.setIncome(new BigDecimal("2500.00"));
        credit.setDependents(2);
        credit.setRiskLevel(RiskLevel.LOW);
        credit.setDecisionDate(LocalDateTime.now());
        credit.setHandledBy(agent.getUserId());
        creditRepository.save(credit);
    }

    private void seedSampleWallet(User client) {
        if (walletRepository.findByUser_UserId(client.getUserId()).isEmpty()) {
            Wallet wallet = new Wallet();
            wallet.setUser(client);
            wallet.setBalance(new BigDecimal("1250.00"));
            wallet.setFrozenBalance(BigDecimal.ZERO);
            walletRepository.save(wallet);
        }
    }
}
