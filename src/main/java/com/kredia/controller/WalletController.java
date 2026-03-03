package com.kredia.controller;

import com.kredia.entity.wallet.Wallet;
import com.kredia.enums.WalletStatus;
import com.kredia.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallets")
public class WalletController {

    private final WalletService walletService;

    @Autowired
    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @PostMapping
    public ResponseEntity<Wallet> createWallet(@RequestBody Wallet wallet) {
        Wallet created = walletService.createWallet(wallet);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Wallet> updateWalletStatus(
            @PathVariable Long id,
            @RequestParam WalletStatus status) {
        return ResponseEntity.ok(walletService.updateWalletStatus(id, status));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Wallet> updateWallet(@PathVariable Long id, @RequestBody Wallet wallet) {
        return ResponseEntity.ok(walletService.updateWallet(id, wallet));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWallet(@PathVariable Long id) {
        walletService.deleteWallet(id);
        return ResponseEntity.noContent().build();
    }
}
