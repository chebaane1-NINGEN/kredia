package com.kredia.kyc.controller;

import com.kredia.kyc.dto.KycDocumentDTO;
import com.kredia.kyc.service.KycService;
import com.kredia.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/kyc")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminKycController {

    private final KycService kycService;

    @GetMapping("/pending")
    public ResponseEntity<List<KycDocumentDTO>> getPendingDocuments() {
        return ResponseEntity.ok(kycService.getPendingDocuments());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<KycDocumentDTO> approveDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(kycService.approveDocument(id, admin.getUserId()));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<KycDocumentDTO> rejectDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(kycService.rejectDocument(id, admin.getUserId()));
    }
}
