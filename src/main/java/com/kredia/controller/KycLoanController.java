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
            @RequestParam("id") Long id,
            @RequestParam("userId") Long userId,
            @RequestParam("documentType") DocumentTypeLoan documentType,
            @RequestParam("file") MultipartFile file) {
        try {
            KycLoanResponse response = kycLoanService.uploadDocument(id, userId, documentType, file);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/create-from-url")
    public ResponseEntity<?> createFromUrl(@RequestBody Map<String, Object> request) {
        try {
            Long id = Long.valueOf(request.get("credit_id").toString());
            Long userId = Long.valueOf(request.get("user_id").toString());
            DocumentTypeLoan documentType = DocumentTypeLoan.valueOf(request.get("document_type").toString());
            String documentPath = request.get("document_path").toString();
            
            KycLoanResponse response = kycLoanService.createFromUrl(id, userId, documentType, documentPath);
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/credit/{id}")
    public ResponseEntity<List<KycLoanResponse>> getDocumentsByCredit(@PathVariable Long id) {
        return new ResponseEntity<>(kycLoanService.getDocumentsByCredit(id), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocumentById(@PathVariable Long id) {
        try {
            return new ResponseEntity<>(kycLoanService.getDocumentById(id), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<?> forceVerification(@PathVariable Long id) {
        try {
            KycLoanResponse response = kycLoanService.forceVerification(id);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
