package com.kredia.controller;

import com.kredia.repository.TransactionRepository;
import com.kredia.repository.WalletRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;

    public StatisticsController(TransactionRepository transactionRepository, WalletRepository walletRepository) {
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboardStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Basic metrics
        stats.put("totalWallets", walletRepository.count());
        stats.put("totalTransactions", transactionRepository.count());
        
        // Advanced metrics via stream processing (for prototype scale)
        var allTransactions = transactionRepository.findAll();
        
        var transactionsByStatus = allTransactions.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getStatus() != null ? t.getStatus().name() : "UNKNOWN", 
                        Collectors.counting()
                ));
        stats.put("transactionsByStatus", transactionsByStatus);
        
        var totalCompletedVolume = allTransactions.stream()
                .filter(t -> t.getStatus() != null && t.getStatus().name().equals("COMPLETED"))
                .map(t -> t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalCompletedTransactionVolume", totalCompletedVolume);

        // Fraud-specific metrics
        var totalFraudulentTransactions = allTransactions.stream()
                .filter(t -> t.getStatus() != null && t.getStatus().name().equals("SUSPECTED_FRAUD"))
                .count();
        stats.put("totalFraudulentTransactions", totalFraudulentTransactions);

        var totalFraudulentVolume = allTransactions.stream()
                .filter(t -> t.getStatus() != null && t.getStatus().name().equals("SUSPECTED_FRAUD"))
                .map(t -> t.getAmount() != null ? t.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("totalFraudulentVolume", totalFraudulentVolume);

        return stats;
    }
}
