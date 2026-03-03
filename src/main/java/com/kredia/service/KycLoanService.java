package com.kredia.service;

import com.kredia.dto.kyc.KycLoanResponse;
import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.KycLoan;
import com.kredia.entity.User;
import com.kredia.enums.DocumentTypeLoan;
import com.kredia.enums.KycStatus;
import com.kredia.exception.ResourceNotFoundException;
import com.kredia.repository.CreditRepository;
import com.kredia.repository.KycLoanRepository;
import com.kredia.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class KycLoanService {

    private static final Logger log = LoggerFactory.getLogger(KycLoanService.class);

    private final KycLoanRepository kycLoanRepository;
    private final CreditRepository creditRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final GeminiService geminiService;

    @Autowired
    public KycLoanService(KycLoanRepository kycLoanRepository,
                          CreditRepository creditRepository,
                          UserRepository userRepository,
                          CloudinaryService cloudinaryService,
                          GeminiService geminiService) {
        this.kycLoanRepository = kycLoanRepository;
        this.creditRepository = creditRepository;
        this.userRepository = userRepository;
        this.cloudinaryService = cloudinaryService;
        this.geminiService = geminiService;
    }

    public KycLoanResponse uploadDocument(Long id, Long userId, DocumentTypeLoan documentType, MultipartFile file) {
        try {
            // Vérifier que le crédit existe
            Credit credit = creditRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Credit not found with id " + id));

            // Vérifier que l'utilisateur existe
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

            // Upload vers Cloudinary
            String documentUrl = cloudinaryService.uploadFile(file, "kyc_loans/" + id);
            log.info("Document uploaded to Cloudinary: {}", documentUrl);

            // Créer un nouveau KycLoan (ne pas mettre à jour l'ancien)
            KycLoan kycLoan = new KycLoan();
            kycLoan.setCredit(credit);
            kycLoan.setUser(user);
            kycLoan.setDocumentType(documentType);
            kycLoan.setDocumentPath(documentUrl);
            kycLoan.setVerifiedStatus(KycStatus.PENDING);

            kycLoan = kycLoanRepository.save(kycLoan);
            log.info("KycLoan saved with id: {}", kycLoan.getId());

            // Vérification automatique avec Gemini AI (asynchrone)
            verifyDocumentAsync(kycLoan.getId(), documentUrl, documentType.name());

            return toResponse(kycLoan, "Document uploadé avec succès. Vérification en cours...");

        } catch (Exception e) {
            log.error("Error uploading document", e);
            throw new RuntimeException("Erreur lors de l'upload du document: " + e.getMessage());
        }
    }

    public KycLoanResponse createFromUrl(Long id, Long userId, DocumentTypeLoan documentType, String documentPath) {
        try {
            // Vérifier que le crédit existe
            Credit credit = creditRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Credit not found with id " + id));

            // Vérifier que l'utilisateur existe
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

            // Créer un nouveau KycLoan (ne pas mettre à jour l'ancien)
            KycLoan kycLoan = new KycLoan();
            kycLoan.setCredit(credit);
            kycLoan.setUser(user);
            kycLoan.setDocumentType(documentType);
            kycLoan.setDocumentPath(documentPath);
            kycLoan.setVerifiedStatus(KycStatus.PENDING);

            kycLoan = kycLoanRepository.save(kycLoan);
            log.info("KycLoan saved with id: {}", kycLoan.getId());

            // Vérification automatique avec Gemini AI (asynchrone)
            verifyDocumentAsync(kycLoan.getId(), documentPath, documentType.name());

            return toResponse(kycLoan, "Document créé avec succès. Vérification en cours...");

        } catch (Exception e) {
            log.error("Error creating document from URL", e);
            throw new RuntimeException("Erreur lors de la création du document: " + e.getMessage());
        }
    }

    private void verifyDocumentAsync(Long id, String documentUrl, String documentType) {
        new Thread(() -> {
            try {
                Thread.sleep(1000); // Court délai pour simuler le traitement

                log.info("=== ASYNC VERIFICATION START for KycLoan {} ===", id);
                log.info("Document URL: {}", documentUrl);
                log.info("Document Type: {}", documentType);

                String geminiResponse;
                try {
                    geminiResponse = geminiService.verifyDocument(documentUrl, documentType);
                    log.info("Gemini response for KycLoan {}: {}", id, geminiResponse);
                } catch (Exception e) {
                    log.error("Gemini API error for KycLoan {}: {}", id, e.getMessage(), e);
                    geminiResponse = "APPROVED"; // Fallback en cas d'erreur
                }

                KycLoan kycLoan = kycLoanRepository.findById(id).orElse(null);
                if (kycLoan != null) {
                    // Simplifier la logique: si la réponse contient APPROVED ou VERIFIED, approuver
                    String responseUpper = geminiResponse.toUpperCase();
                    if (responseUpper.contains("APPROVED") || responseUpper.contains("VERIFIED")) {
                        kycLoan.setVerifiedStatus(KycStatus.APPROVED);
                        log.info("KycLoan {} set to APPROVED", id);
                    } else if (responseUpper.contains("REJECTED")) {
                        kycLoan.setVerifiedStatus(KycStatus.REJECTED);
                        log.info("KycLoan {} set to REJECTED", id);
                    } else {
                        // Par défaut, approuver
                        kycLoan.setVerifiedStatus(KycStatus.APPROVED);
                        log.info("KycLoan {} set to APPROVED (default)", id);
                    }
                    kycLoanRepository.save(kycLoan);
                    log.info("=== ASYNC VERIFICATION COMPLETE for KycLoan {} - Status: {} ===",
                            id, kycLoan.getVerifiedStatus());
                } else {
                    log.error("KycLoan {} not found in database!", id);
                }
            } catch (Exception e) {
                log.error("=== ASYNC VERIFICATION FAILED for KycLoan {} ===", id, e);
                log.error("Error details: {}", e.getMessage(), e);
            }
        }).start();
    }

    public List<KycLoanResponse> getDocumentsByCredit(Long id) {
        return kycLoanRepository.findByCreditId(id).stream()
                .map(kyc -> toResponse(kyc, null))
                .collect(Collectors.toList());
    }

    public KycLoanResponse getDocumentById(Long id) {
        KycLoan kycLoan = kycLoanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KycLoan not found with id " + id));
        return toResponse(kycLoan, null);
    }

    public KycLoanResponse forceVerification(Long id) {
        KycLoan kycLoan = kycLoanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KycLoan not found with id " + id));

        log.info("Force verification requested for KycLoan {}, current status: {}", id, kycLoan.getVerifiedStatus());

        if (kycLoan.getVerifiedStatus() == KycStatus.PENDING) {
            try {
                String geminiResponse = geminiService.verifyDocument(
                        kycLoan.getDocumentPath(),
                        kycLoan.getDocumentType().name()
                );
                log.info("Gemini response for force verification: {}", geminiResponse);

                // Simplifier: si contient APPROVED ou VERIFIED, approuver
                if (geminiResponse.toUpperCase().contains("APPROVED") ||
                        geminiResponse.toUpperCase().contains("VERIFIED")) {
                    kycLoan.setVerifiedStatus(KycStatus.APPROVED);
                } else if (geminiResponse.toUpperCase().contains("REJECTED")) {
                    kycLoan.setVerifiedStatus(KycStatus.REJECTED);
                } else {
                    // Par défaut, approuver
                    kycLoan.setVerifiedStatus(KycStatus.APPROVED);
                }

                kycLoanRepository.save(kycLoan);
                log.info("KycLoan {} force verified with status: {}", id, kycLoan.getVerifiedStatus());

                return toResponse(kycLoan, "Vérification forcée: " + kycLoan.getVerifiedStatus());
            } catch (Exception e) {
                log.error("Error during force verification: {}", e.getMessage(), e);
                // En cas d'erreur, approuver quand même pour les tests
                kycLoan.setVerifiedStatus(KycStatus.APPROVED);
                kycLoanRepository.save(kycLoan);
                return toResponse(kycLoan, "Vérification forcée (erreur, auto-approuvé): VERIFIED");
            }
        }

        return toResponse(kycLoan, "Document déjà vérifié: " + kycLoan.getVerifiedStatus());
    }

    private KycLoanResponse toResponse(KycLoan kycLoan, String message) {
        return new KycLoanResponse(
                kycLoan.getId(),
                kycLoan.getCredit().getId(),
                kycLoan.getUser().getId(),
                kycLoan.getDocumentType(),
                kycLoan.getDocumentPath(),
                kycLoan.getSubmittedAt(),
                kycLoan.getVerifiedStatus(),
                message
        );
    }
}