package com.kredia.controller;

import com.kredia.dto.WalletResponseDTO;
import com.kredia.service.WalletService;
import com.kredia.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public ResponseEntity<WalletResponseDTO> getMyWallet(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(walletService.getMyWallet(user.getUserId()));
    }
}
