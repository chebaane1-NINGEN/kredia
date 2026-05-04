package com.kredia.config;

import com.hedera.hashgraph.sdk.AccountId;
import com.hedera.hashgraph.sdk.Client;
import com.hedera.hashgraph.sdk.PrivateKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class HederaConfig {

    @Value("${hedera.accountId}")
    private String accountId;

    @Value("${hedera.privateKey}")
    private String privateKey;

    @Value("${hedera.network:testnet}")
    private String network;

    @Bean
    public Client hederaClient() {
        Client client;
        if ("mainnet".equalsIgnoreCase(network)) {
            client = Client.forMainnet();
        } else {
            client = Client.forTestnet();
        }

        if (accountId != null && !accountId.isEmpty() && privateKey != null && !privateKey.isEmpty()) {
            log.info("Setting Hedera operator: {}", accountId.trim());
            try {
                String keyStr = privateKey.trim();
                if (keyStr.startsWith("0x")) {
                    keyStr = keyStr.substring(2);
                }
                
                // Using fromStringECDSA since portal now generates raw ECDSA keys
                PrivateKey pk = PrivateKey.fromStringECDSA(keyStr);
                
                log.info("Loaded key type: {}", pk.getClass().getSimpleName());
                client.setOperator(AccountId.fromString(accountId.trim()), pk);
                log.info("Hedera operator set successfully.");
                log.info("App is using Public Key: {}", pk.getPublicKey().toString());
                
                // Diagnostic: Try to fetch balance to verify key matches account
                try {
                    com.hedera.hashgraph.sdk.Hbar balance = new com.hedera.hashgraph.sdk.AccountBalanceQuery()
                        .setAccountId(AccountId.fromString(accountId.trim()))
                        .execute(client).hbars;
                    log.info("Successfully connected to Hedera. Account balance: {}", balance);

                    // Diagnostic: Check topic info to see if it requires a submit key
                    try {
                        String topicIdStr = System.getProperty("hedera.topicId"); // Get from sys props or use injection
                        // Better to use the injected topicId if possible, but for diagnostic we can just use the property
                        com.hedera.hashgraph.sdk.TopicInfo info = new com.hedera.hashgraph.sdk.TopicInfoQuery()
                            .setTopicId(com.hedera.hashgraph.sdk.TopicId.fromString("0.0.7958434"))
                            .execute(client);
                        log.info("Topic info fetched. Submit Key present: {}", info.submitKey != null);
                        if (info.submitKey != null) {
                            log.warn("WARNING: Topic 0.0.7958434 requires a SUBMIT KEY. If your account is not the submitter, transactions will fail.");
                        }
                    } catch (Exception te) {
                        log.error("Could not fetch Topic Info: {}", te.getMessage());
                    }
                } catch (Exception e) {
                    log.error("Credentials check FAILED: Key does not seem to match account or account has no HBAR. Error: {}", e.getMessage());
                }
            } catch (Exception e) {
                log.error("Failed to set Hedera operator. Check accountId/privateKey format: {}", e.getMessage());
            }
        } else {
            log.warn("Hedera accountId or privateKey is missing in configuration!");
        }

        return client;
    }
}
