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
import java.util.stream.Collectors;

@Service
public class FraudDetectionService {

    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final ChatClient chatClient;

    private static final BigDecimal LARGE_AMOUNT_THRESHOLD = new BigDecimal("10000.00");
    private static final long HIGH_FREQUENCY_THRESHOLD = 10;
    private static final int DETECTION_WINDOW_HOURS = 24;

    @Autowired
    public FraudDetectionService(TransactionRepository transactionRepository, WalletService walletService, ChatClient.Builder chatClientBuilder) {
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.chatClient = chatClientBuilder.build();
    }

    public void analyzeTransaction(Transaction transaction) {
        boolean isFraudulent = false;
        StringBuilder fraudReason = new StringBuilder();

        if (transaction.getAmount().compareTo(LARGE_AMOUNT_THRESHOLD) > 0) {
            isFraudulent = true;
            fraudReason.append("Amount exceeds large transaction threshold. ");
        }

        LocalDateTime startDate = LocalDateTime.now().minusHours(DETECTION_WINDOW_HOURS);
        if (transactionRepository.countOutgoingTransactionsSince(transaction.getSourceWallet().getWalletId(), startDate) > HIGH_FREQUENCY_THRESHOLD) {
            isFraudulent = true;
            fraudReason.append("High frequency of transactions in a short period. ");
        }

        if (isFraudulent) {
            flagTransaction(transaction, fraudReason.toString());
        }
    }

    private void flagTransaction(Transaction transaction, String reason) {
        transaction.setStatus(TransactionStatus.SUSPECTED_FRAUD);
        transaction.setDescription("SUSPECTED FRAUD: " + reason);
        transactionRepository.save(transaction);
        
        System.out.println("Fraud detected for transaction ID: " + transaction.getTransactionId() + " Reason: " + reason);
        walletService.freezeWallet(transaction.getSourceWallet().getWalletId());
        System.out.println("Wallet ID: " + transaction.getSourceWallet().getWalletId() + " has been frozen due to suspected fraud.");
    }

    public List<Transaction> getSuspectedTransactions() {
        return transactionRepository.findByStatus(TransactionStatus.SUSPECTED_FRAUD);
    }

    public String generateTransactionDescriptionWithGemini(Transaction transaction) {
        String prompt = String.format("Analyze the following transaction and provide a clear, user-friendly description of its purpose and risk level. \n" +
                "Transaction ID: %d\n" +
                "Amount: %s\n" +
                "Source Wallet ID: %d\n" +
                "Destination Wallet ID: %s\n" +
                "Status: %s\n" +
                "Current Description: %s",
                transaction.getTransactionId(),
                transaction.getAmount().toString(),
                transaction.getSourceWallet().getWalletId(),
                transaction.getDestinationWallet() != null ? transaction.getDestinationWallet().getWalletId() : "N/A",
                transaction.getStatus(),
                transaction.getDescription()
        );

        try {
            String result = chatClient.prompt().user(prompt).call().content();
            
            if (result == null || result.isEmpty()) {
                result = "AI was unable to generate a detailed summary at this time.";
            }

            transaction.setDescription(transaction.getDescription() + " | AI Analysis: " + result);
            transactionRepository.save(transaction);

            return result;
        } catch (Exception e) {
            System.err.println("AI Error: " + e.getMessage());
            String fallback = "Standard system analysis: This transaction is currently flagged for manual review.";
            transaction.setDescription(transaction.getDescription() + " | AI analysis unavailable.");
            transactionRepository.save(transaction);
            return fallback;
        }
    }
}
