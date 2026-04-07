package com.kredia.service;

import com.kredia.entity.wallet.Transaction;
import com.kredia.enums.TransactionStatus;
import com.kredia.repository.TransactionRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FraudDetectionService {

    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final ChatClient chatClient;

    private static final BigDecimal LARGE_AMOUNT_THRESHOLD = new BigDecimal("10000.00");
    private static final long HIGH_FREQUENCY_THRESHOLD = 10;
    private static final int DETECTION_WINDOW_HOURS = 24;

    @Autowired
    public FraudDetectionService(TransactionRepository transactionRepository, 
                                WalletService walletService,
                                ChatClient.Builder chatClientBuilder) {
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.chatClient = chatClientBuilder.build();
    }

    public void analyzeTransaction(Transaction transaction) {
        boolean isFraudulent = false;
        StringBuilder fraudReason = new StringBuilder();

        // Rule 1: Large amount check
        if (transaction.getAmount().compareTo(LARGE_AMOUNT_THRESHOLD) > 0) {
            isFraudulent = true;
            fraudReason.append("Amount exceeds large transaction threshold ($10,000). ");
        }

        // Rule 2: High frequency check (Velocity attack)
        LocalDateTime startDate = LocalDateTime.now().minusHours(DETECTION_WINDOW_HOURS);
        long recentTxCount = transactionRepository.countOutgoingTransactionsSince(transaction.getSourceWallet().getWalletId(), startDate);
        if (recentTxCount > HIGH_FREQUENCY_THRESHOLD) {
            isFraudulent = true;
            fraudReason.append(String.format("High frequency of transactions (%d) in the last %d hours. ", recentTxCount, DETECTION_WINDOW_HOURS));
        }

        if (isFraudulent) {
            flagTransaction(transaction, fraudReason.toString());
        }
    }

    private void flagTransaction(Transaction transaction, String reason) {
        transaction.setStatus(TransactionStatus.SUSPECTED_FRAUD);
        transaction.setDescription("SUSPECTED FRAUD: " + reason + (transaction.getDescription() != null ? " | " + transaction.getDescription() : ""));
        transactionRepository.save(transaction);

        System.out.println("Fraud detected for transaction ID: " + transaction.getTransactionId() + " Reason: " + reason);
        
        // Take immediate action: Freeze the wallet to prevent further loss
        walletService.freezeWallet(transaction.getSourceWallet().getWalletId());
        System.out.println("Wallet ID: " + transaction.getSourceWallet().getWalletId() + " has been frozen due to suspected fraud.");
    }

    public List<Transaction> getSuspectedTransactions() {
        return transactionRepository.findByStatus(TransactionStatus.SUSPECTED_FRAUD);
    }

    /**
     * Uses Gemini AI to analyze a transaction and provide a natural language summary and risk assessment.
     */
    public String generateTransactionDescriptionWithGemini(Transaction transaction) {
        String prompt = String.format("Analyze the following transaction in a financial application and provide a clear, user-friendly description of its purpose and risk level. \n" +
                "Transaction ID: %d\n" +
                "Amount: %s\n" +
                "Source Wallet ID: %d\n" +
                "Destination Wallet ID: %s\n" +
                "Status: %s\n" +
                "Current Description: %s\n\n" +
                "Please provide a concise summary (max 3 sentences) that assesses if this looks like normal activity or has suspicious patterns.",
                transaction.getTransactionId(),
                transaction.getAmount().toString(),
                transaction.getSourceWallet().getWalletId(),
                transaction.getDestinationWallet() != null ? transaction.getDestinationWallet().getWalletId() : "N/A",
                transaction.getStatus(),
                transaction.getDescription()
        );

        try {
            String result = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            if (result == null || result.isEmpty()) {
                result = "AI analysis timed out or returned no content.";
            }

            // Update the transaction description with the AI summary
            String updatedDescription = (transaction.getDescription() != null ? transaction.getDescription() : "") + " | AI Analysis: " + result;
            transaction.setDescription(updatedDescription);
            transactionRepository.save(transaction);

            return result;
        } catch (Exception e) {
            System.err.println("Error generating AI description with Gemini: " + e.getMessage());
            return "AI Analysis unavailable: " + e.getMessage();
        }
    }
}
