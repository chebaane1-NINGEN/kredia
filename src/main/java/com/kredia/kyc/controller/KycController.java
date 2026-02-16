package com.kredia.kyc.controller;

import com.kredia.common.UserStatus;
import com.kredia.enums.KycDocumentType;
import com.kredia.kyc.dto.KycDocumentDTO;
import com.kredia.kyc.service.KycService;
import com.kredia.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/kyc")
@RequiredArgsConstructor
public class KycController {

    private final KycService kycService;

    @PostMapping("/upload")
    public ResponseEntity<KycDocumentDTO> uploadDocument(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") KycDocumentType type) throws IOException {
        return ResponseEntity.ok(kycService.uploadDocument(user.getUserId(), file, type));
    }

    @GetMapping("/my-documents")
    public ResponseEntity<List<KycDocumentDTO>> getMyDocuments(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(kycService.getMyDocuments(user.getUserId()));
    }

    @GetMapping("/status")
    public ResponseEntity<UserStatus> getStatus(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(kycService.getKycStatus(user.getUserId()));
    }
}
