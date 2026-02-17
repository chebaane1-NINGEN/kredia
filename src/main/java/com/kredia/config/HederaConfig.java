package com.kredia.config;

import com.hedera.hashgraph.sdk.AccountId;
import com.hedera.hashgraph.sdk.Client;
import com.hedera.hashgraph.sdk.PrivateKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
            client.setOperator(AccountId.fromString(accountId), PrivateKey.fromString(privateKey));
        }

        return client;
    }
}
