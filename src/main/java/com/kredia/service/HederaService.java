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
    
    @Value("${hedera.topicId}")
    private String topicId;

    @Autowired
    public HederaService(Client client) {
        this.client = client;
    }

    /**
     * Sends a message to the Hedera Consensus Service topic.
     * @param message The message to send (e.g., a data hash).
     * @return The transaction ID of the submission (formatted as a string) or null if failed.
     */
    public String sendToConsensusService(String message) {
        if (topicId == null || topicId.isEmpty()) {
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
            
            log.info("Message sent to Hedera. Transaction ID: {}, Status: {}", 
                    response.transactionId, receipt.status);
            
            return response.transactionId.toString();
        } catch (PrecheckStatusException | ReceiptStatusException | TimeoutException e) {
            log.error("Failed to send message to Hedera Consensus Service", e);
            return null;
        }
    }
}
