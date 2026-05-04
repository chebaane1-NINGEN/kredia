package com.kredia.controller;

import com.kredia.dto.wallet.VirtualCardExternalPaymentRequest;
import com.kredia.dto.wallet.VirtualCardExternalPaymentResponse;
import com.kredia.entity.wallet.VirtualCard;
import com.kredia.entity.wallet.Wallet;
import com.kredia.service.PaypalService;
import com.kredia.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/wallets")
public class WalletController {

    private final WalletService walletService;
    private final PaypalService paypalService;

    @Autowired
    public WalletController(WalletService walletService, PaypalService paypalService) {
        this.walletService = walletService;
        this.paypalService = paypalService;
    }

    @io.swagger.v3.oas.annotations.Operation(summary = "Create a new wallet", description = "Creates a wallet for an existing user")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Wallet created successfully")
    @PostMapping
    public ResponseEntity<Wallet> createWallet(@RequestBody Wallet wallet) {
        Wallet createdWallet = walletService.createWallet(wallet);
        return new ResponseEntity<>(createdWallet, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Wallet> updateWallet(@PathVariable Long id, @RequestBody Wallet walletDetails) {
        try {
            Wallet updatedWallet = walletService.updateWallet(id, walletDetails);
            return new ResponseEntity<>(updatedWallet, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWallet(@PathVariable Long id) {
        try {
            walletService.deleteWallet(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/freeze")
    public ResponseEntity<Void> freezeWallet(@PathVariable Long id) {
        try {
            walletService.freezeWallet(id);
            return new ResponseEntity<>(HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @io.swagger.v3.oas.annotations.Operation(
            summary = "Generate a virtual card for a wallet",
            description = "Creates a new virtual card linked to the specified wallet using the PayPal integration"
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "201",
            description = "Virtual card generated successfully"
    )
    @PostMapping("/{id}/virtual-card")
    public ResponseEntity<VirtualCard> generateVirtualCard(@PathVariable("id") Long walletId) {
        try {
            VirtualCard virtualCard = paypalService.generateVirtualCard(walletId);
            return new ResponseEntity<>(virtualCard, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @io.swagger.v3.oas.annotations.Operation(
            summary = "Get virtual cards for a wallet",
            description = "Returns all virtual cards linked to the specified wallet"
    )
    @GetMapping("/{id}/virtual-cards")
    public ResponseEntity<List<VirtualCard>> getVirtualCardsByWallet(@PathVariable("id") Long walletId) {
        return new ResponseEntity<>(paypalService.getVirtualCardsByWalletId(walletId), HttpStatus.OK);
    }

    @io.swagger.v3.oas.annotations.Operation(
            summary = "Create an external payment using a virtual card",
            description = "Uses virtual card details to pay external bodies and returns a PayPal approval link or confirmation"
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(
            responseCode = "200",
            description = "External payment created successfully"
    )
    @PostMapping("/virtual-cards/{virtualCardId}/external-payment")
    public ResponseEntity<?> createExternalPayment(
            @PathVariable Long virtualCardId,
            @Valid @RequestBody VirtualCardExternalPaymentRequest request
    ) {
        try {
            VirtualCardExternalPaymentResponse paymentResponse = paypalService.createExternalPayment(
                    virtualCardId,
                    request.cardNumber(),
                    request.cvv(),
                    request.expiryDate(),
                    request.amount()
            );
            return new ResponseEntity<>(paymentResponse, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(Map.of("message", e.getMessage()), HttpStatus.BAD_REQUEST);
        }
    }
}
