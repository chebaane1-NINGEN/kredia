package com.kredia.controller;

import com.kredia.dto.kyc.KycLoanResponse;
import com.kredia.enums.DocumentTypeLoan;
import com.kredia.service.KycLoanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kyc-loans")
public class KycLoanController {

    private final KycLoanService kycLoanService;

    @Autowired
    public KycLoanController(KycLoanService kycLoanService) {
        this.kycLoanService = kycLoanService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("creditId") Long creditId,
            @RequestParam("userId") Long userId,
            @RequestParam("documentType") DocumentTypeLoan documentType,
            @RequestParam("file") MultipartFile file) {
        try {
            KycLoanResponse response = kycLoanService.uploadDocument(creditId, userId, documentType, file);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/create-from-url")
    public ResponseEntity<?> createFromUrl(@RequestBody Map<String, Object> request) {
        try {
            Long creditId = Long.valueOf(request.get("credit_id").toString());
            Long userId = Long.valueOf(request.get("user_id").toString());
            DocumentTypeLoan documentType = DocumentTypeLoan.valueOf(request.get("document_type").toString());
            String documentPath = request.get("document_path").toString();
            
            KycLoanResponse response = kycLoanService.createFromUrl(creditId, userId, documentType, documentPath);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/credit/{creditId}")
    public ResponseEntity<List<KycLoanResponse>> getDocumentsByCredit(@PathVariable Long creditId) {
        return new ResponseEntity<>(kycLoanService.getDocumentsByCredit(creditId), HttpStatus.OK);
    }

    @GetMapping("/{kycLoanId}")
    public ResponseEntity<?> getDocumentById(@PathVariable Long kycLoanId) {
        try {
            return new ResponseEntity<>(kycLoanService.getDocumentById(kycLoanId), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{kycLoanId}/verify")
    public ResponseEntity<?> forceVerification(@PathVariable Long kycLoanId) {
        try {
            KycLoanResponse response = kycLoanService.forceVerification(kycLoanId);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
