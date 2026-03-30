package com.kredia.service;

import com.hedera.hashgraph.sdk.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeoutException;

@Slf4j
@Service
public class HederaService {

    private final Client client;
    
    private final String topicId;

    @Autowired
    public HederaService(Client client, @Value("${hedera.topicId:#{null}}") String topicId) {
        this.client = client;
        this.topicId = topicId != null ? topicId.trim() : null;
        if (this.topicId == null || this.topicId.isEmpty()) {
            log.warn("Hedera topicId is not configured. You may need to create one.");
        } else {
            log.info("Hedera Service initialized with topicId: {}", this.topicId);
        }
    }

    /**
     * Sends a message to the Hedera Consensus Service topic.
     * @param message The message to send (e.g., a data hash).
     * @return The transaction ID of the submission (formatted as a string) or null if failed.
     */
    public String sendToConsensusService(String message) {
        System.out.println("[HEDERA] Attempting to send message to topic: " + topicId);
        if (topicId == null || topicId.isEmpty()) {
            System.out.println("[HEDERA] WARN: Topic ID is missing!");
            log.warn("Hedera topicId is not configured. Skipping blockchain audit log.");
            return null;
        }

        try {
            log.debug("Sending message to Hedera topic {}: {}", topicId, message);
            
            TransactionResponse response = new TopicMessageSubmitTransaction()
                    .setTopicId(TopicId.fromString(topicId))
                    .setMessage(message)
                    .execute(client);

            TransactionReceipt receipt = response.getReceipt(client);
            
            System.out.println("[HEDERA] SUCCESS! Message sent. ID: " + response.transactionId);
            log.info("Message sent to Hedera. Transaction ID: {}, Status: {}", 
                    response.transactionId, receipt.status);
            
            return response.transactionId.toString();
        } catch (Exception e) {
            System.out.println("[HEDERA] ERROR: " + e.getMessage());
            log.error("Critical error while sending message to Hedera. Message: {}, Exception: {}", 
                    message, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Creates a new public topic on Hedera and returns its ID.
     */
    public String createNewTopic() {
        try {
            com.hedera.hashgraph.sdk.TransactionResponse response = new com.hedera.hashgraph.sdk.TopicCreateTransaction()
                    .execute(client);
            com.hedera.hashgraph.sdk.TransactionReceipt receipt = response.getReceipt(client);
            String newTopicId = receipt.topicId.toString();
            log.info("Created NEW Hedera Topic: {}", newTopicId);
            System.out.println("[HEDERA] CREATED NEW TOPIC: " + newTopicId);
            return newTopicId;
        } catch (Exception e) {
            log.error("Failed to create new topic: {}", e.getMessage());
            return null;
        }
    }
}
