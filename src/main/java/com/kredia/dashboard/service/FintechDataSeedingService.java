package com.kredia.dashboard.service;

import com.kredia.common.Role;
import com.kredia.common.UserStatus;
import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.Echeance;
import com.kredia.entity.wallet.Transaction;
import com.kredia.entity.wallet.Wallet;
import com.kredia.enums.*;
import com.kredia.repository.*;
import com.kredia.user.entity.User;
import com.kredia.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FintechDataSeedingService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FintechDataSeedingService.class);

    private final UserRepository userRepository;
    private final CreditRepository creditRepository;
    private final EcheanceRepository echeanceRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;
    private final ScoringService scoringService;

    private final Random random = new Random(42); // Fixed seed for reproducibility

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedProductionData() {
        if (userRepository.count() > 10) {
            log.info("Fintech Data Seeding skipped - data already exists.");
            return;
        }

        log.info("Starting Fintech Data Seeding for Pi Micro-Finance...");
        
        // 1. Generate core Admin and Agent
        createSystemUsers();

        // 2. Generate 1,000 Clients
        List<User> clients = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            clients.add(createRandomClient(i));
        }
        userRepository.saveAll(clients);
        log.info("1,000 Clients generated.");

        // 3. Generate Wallets and Credits
        for (User client : clients) {
            Wallet wallet = createWallet(client);
            walletRepository.save(wallet);

            int loanCount = random.nextInt(3); // 0 to 2 loans per user
            for (int j = 0; j < loanCount; j++) {
                Credit credit = createCredit(client, j);
                creditRepository.save(credit);
                
                // 4. Generate Echeances and Payments
                generateRepaymentSchedule(credit, wallet);
            }
        }

        log.info("Fintech Data Seeding completed successfully.");
    }

    private void createSystemUsers() {
        if (userRepository.findByEmail("admin@kredia.com").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@kredia.com");
            admin.setFirstName("Super");
            admin.setLastName("Admin");
            admin.setPasswordHash(passwordEncoder.encode("password"));
            admin.setRole(Role.ADMIN);
            admin.setStatus(UserStatus.VERIFIED);
            admin.setPhoneNumber("12345678");
            admin.setCreatedAt(LocalDateTime.now().minusMonths(24));
            userRepository.save(admin);
        }
    }

    private User createRandomClient(int index) {
        User user = new User();
        user.setEmail("client" + index + "@kredia-fintech.com");
        user.setFirstName("User" + index);
        user.setLastName("Kredia");
        user.setPasswordHash(passwordEncoder.encode("password"));
        user.setRole(Role.CLIENT);
        user.setPhoneNumber("216" + (90000000 + index));
        
        // Statistically distribute statuses
        double rand = random.nextDouble();
        if (rand < 0.85) user.setStatus(UserStatus.VERIFIED);
        else if (rand < 0.95) user.setStatus(UserStatus.PENDING);
        else user.setStatus(UserStatus.BLOCKED);

        // Created spread over 24 months
        user.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(730)));
        return user;
    }

    private Wallet createWallet(User user) {
        Wallet wallet = new Wallet();
        wallet.setUser(user);
        wallet.setBalance(BigDecimal.valueOf(random.nextInt(5000)));
        return wallet;
    }

    private Credit createCredit(User user, int loanIndex) {
        Credit credit = new Credit();
        credit.setUser(user);
        
        // Real income levels
        int baseIncome = 800 + random.nextInt(4000);
        credit.setIncome(BigDecimal.valueOf(baseIncome));
        credit.setDependents(random.nextInt(5));
        
        float requested = 500 + random.nextInt(10000);
        credit.setAmount(requested);
        credit.setInterestRate(12.0f + random.nextFloat() * 8.0f);
        credit.setTermMonths(6 + 6 * random.nextInt(4)); // 6, 12, 18, 24
        
        // Distribution of ages and Behavior
        LocalDateTime createdAt = user.getCreatedAt().plusDays(random.nextInt(30));
        credit.setCreatedAt(createdAt);
        credit.setStartDate(createdAt.toLocalDate());
        credit.setEndDate(credit.getStartDate().plusMonths(credit.getTermMonths()));

        // Credit Decision Logic
        double score = scoringService.calculateScore(user, credit);
        if (score > 70) credit.setRiskLevel(RiskLevel.LOW);
        else if (score > 40) credit.setRiskLevel(RiskLevel.MEDIUM);
        else credit.setRiskLevel(RiskLevel.HIGH);

        // Status distribution
        double sRand = random.nextDouble();
        if (sRand < 0.20) credit.setStatus(CreditStatus.PENDING);
        else if (sRand < 0.80) {
            credit.setStatus(CreditStatus.APPROVED);
            credit.setDecisionDate(createdAt.plusHours(random.nextInt(48)));
        } else {
            credit.setStatus(CreditStatus.REJECTED);
            credit.setDecisionDate(createdAt.plusHours(random.nextInt(48)));
        }

        return credit;
    }

    private void generateRepaymentSchedule(Credit credit, Wallet wallet) {
        if (credit.getStatus() != CreditStatus.APPROVED) return;

        int terms = credit.getTermMonths();
        BigDecimal monthlyRate = BigDecimal.valueOf(credit.getInterestRate() / 100 / 12);
        BigDecimal totalPrincipal = BigDecimal.valueOf(credit.getAmount());
        
        // Simple P+I monthly installment
        BigDecimal monthlyAmount = totalPrincipal.divide(BigDecimal.valueOf(terms), 2, RoundingMode.HALF_UP)
                .add(totalPrincipal.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP));

        List<Echeance> echeances = new ArrayList<>();
        for (int i = 1; i <= terms; i++) {
            Echeance e = new Echeance();
            e.setCredit(credit);
            e.setDueDate(credit.getStartDate().plusMonths(i));
            e.setAmountDue(monthlyAmount);
            
            // Repayment Behavior simulation
            processRepaymentSimulation(e, wallet);
            echeances.add(e);
        }
        echeanceRepository.saveAll(echeances);
    }

    private void processRepaymentSimulation(Echeance e, Wallet wallet) {
        LocalDate now = LocalDate.now();
        
        if (e.getDueDate().isBefore(now)) {
            double behavior = random.nextDouble();
            if (behavior < 0.90) { // On-time
                e.setAmountPaid(e.getAmountDue());
                e.setStatus(EcheanceStatus.PAID);
                e.setPaidAt(e.getDueDate().atTime(10, 0));
                createPaymentTransaction(e, wallet);
            } else if (behavior < 0.97) { // Late/Partial
                e.setAmountPaid(e.getAmountDue().multiply(BigDecimal.valueOf(0.5)));
                e.setStatus(EcheanceStatus.PARTIALLY_PAID);
                e.setPaidAt(e.getDueDate().plusDays(2).atTime(14, 0));
                createPaymentTransaction(e, wallet);
            } else { // Overdue
                e.setAmountPaid(BigDecimal.ZERO);
                e.setStatus(EcheanceStatus.OVERDUE);
            }
        } else {
            e.setStatus(EcheanceStatus.PENDING);
            e.setAmountPaid(BigDecimal.ZERO);
        }
    }

    private void createPaymentTransaction(Echeance e, Wallet wallet) {
        Transaction t = new Transaction();
        t.setSourceWallet(wallet);
        t.setAmount(e.getAmountPaid());
        t.setStatus(TransactionStatus.COMPLETED);
        t.setTransactionDate(e.getPaidAt());
        t.setReference("PAY-" + UUID.randomUUID().toString().substring(0, 8));
        t.setDescription("Loan repayment for ID " + e.getCredit().getCreditId());
        transactionRepository.save(t);
    }
}
