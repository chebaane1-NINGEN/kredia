package com.kredia.service;

import com.kredia.dto.wallet.VirtualCardExternalPaymentResponse;
import com.kredia.entity.wallet.VirtualCard;
import com.kredia.entity.wallet.Wallet;
import com.kredia.repository.VirtualCardRepository;
import com.kredia.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Random;

@Service
public class PaypalService {

    private final VirtualCardRepository virtualCardRepository;
    private final WalletRepository walletRepository;

    public PaypalService(VirtualCardRepository virtualCardRepository, WalletRepository walletRepository) {
        this.virtualCardRepository = virtualCardRepository;
        this.walletRepository = walletRepository;
    }

    @Transactional
    public VirtualCard generateVirtualCard(Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found with id: " + walletId));

        // Reuse existing ACTIVE virtual card if one already exists for this wallet
        return virtualCardRepository.findFirstByWallet_WalletIdAndStatus(walletId, "ACTIVE")
                .orElseGet(() -> {
                    // Generate mock virtual card details
                    Random random = new Random();
                    String cardNumber = "4" + String.format("%015d", Math.abs(random.nextLong() % 1000000000000000L));
                    String cvv = String.format("%03d", random.nextInt(1000));
                    String expiryDate = "12/28"; // Mock future date

                    VirtualCard virtualCard = VirtualCard.builder()
                            .wallet(wallet)
                            .cardNumber(cardNumber)
                            .cvv(cvv)
                            .expiryDate(expiryDate)
                            .provider("PAYPAL")
                            .status("ACTIVE")
                            .build();

                    return virtualCardRepository.saveAndFlush(virtualCard);
                });
    }

    @Transactional(readOnly = true)
    public List<VirtualCard> getVirtualCardsByWalletId(Long walletId) {
        return virtualCardRepository.findByWallet_WalletId(walletId);
    }

    @Transactional
    public VirtualCardExternalPaymentResponse createExternalPayment(Long virtualCardId, String cardNumber, String cvv, String expiryDate, BigDecimal amount) {
        VirtualCard virtualCard = virtualCardRepository.findById(virtualCardId)
                .orElseThrow(() -> new IllegalArgumentException("Virtual card not found"));

        if (!"ACTIVE".equalsIgnoreCase(virtualCard.getStatus())) {
            throw new IllegalArgumentException("Virtual card is not active");
        }

        if (!virtualCard.getCardNumber().equals(cardNumber)
                || !virtualCard.getCvv().equals(cvv)
                || !virtualCard.getExpiryDate().equals(expiryDate)) {
            throw new IllegalArgumentException("Provided card information does not match the stored virtual card");
        }

        Wallet wallet = virtualCard.getWallet();
        if (wallet == null) {
            throw new IllegalArgumentException("No wallet linked to this virtual card");
        }

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient wallet balance for this external payment");
        }

        BigDecimal oldBalance = wallet.getBalance();

        // Deduct from wallet balance
        BigDecimal newBalance = oldBalance.subtract(amount);
        wallet.setBalance(newBalance);
        walletRepository.save(wallet);

        // Here we would implement the paypal-server-sdk logic to create an order
        // and return the approval link or proceed with capturing the payment.
        // For example:
        // PayPalEnvironment environment = new PayPalEnvironment.Sandbox(clientId, clientSecret);
        // PayPalHttpClient client = new PayPalHttpClient(environment);
        // OrdersCreateRequest request = new OrdersCreateRequest();
        // request.requestBody(buildRequestBody(amount));
        // HttpResponse<Order> response = client.execute(request);
        // return response.result().links().get(1).href(); // Example approval link
        
        String approvalLink = "https://www.sandbox.paypal.com/checkoutnow?token=mock_token_for_amount_" + amount;
        return new VirtualCardExternalPaymentResponse(approvalLink, amount, oldBalance, newBalance);
    }
}
