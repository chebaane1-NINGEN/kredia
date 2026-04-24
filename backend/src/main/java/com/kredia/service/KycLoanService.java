package com.kredia.service;

import com.kredia.dto.kyc.KycLoanResponse;
import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.DemandeCredit;
import com.kredia.entity.credit.KycLoan;
import com.kredia.entity.user.User;
import com.kredia.enums.DocumentTypeLoan;
import com.kredia.enums.KycStatus;
import com.kredia.exception.NotFoundException;
import com.kredia.repository.CreditRepository;
import com.kredia.repository.DemandeCreditRepository;
import com.kredia.repository.KycLoanRepository;
import com.kredia.repository.user.UserRepository;
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
    private final DemandeCreditRepository demandeCreditRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final GeminiService geminiService;

    @Autowired
    public KycLoanService(KycLoanRepository kycLoanRepository,
                          CreditRepository creditRepository,
                          DemandeCreditRepository demandeCreditRepository,
                          UserRepository userRepository,
                          CloudinaryService cloudinaryService,
                          GeminiService geminiService) {
        this.kycLoanRepository = kycLoanRepository;
        this.creditRepository = creditRepository;
        this.demandeCreditRepository = demandeCreditRepository;
        this.userRepository = userRepository;
        this.cloudinaryService = cloudinaryService;
        this.geminiService = geminiService;
    }

    public KycLoanResponse uploadDocument(Long creditId, Long userId, DocumentTypeLoan documentType, MultipartFile file) {
        try {
            Credit credit = creditRepository.findById(creditId).orElse(null);
            DemandeCredit demande = null;

            if (credit == null) {
                demande = demandeCreditRepository.findById(creditId).orElse(null);
                if (demande != null && demande.getCredit() != null) {
                    credit = demande.getCredit();
                }
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found with id " + userId));

            String documentUrl = cloudinaryService.uploadFile(file, "kyc_loans/" + creditId);
            log.info("Document uploaded to Cloudinary: {}", documentUrl);

            KycLoan kycLoan = new KycLoan();
            kycLoan.setCredit(credit);
            kycLoan.setDemande(demande);
            kycLoan.setUser(user);
            kycLoan.setDocumentType(documentType);
            kycLoan.setDocumentPath(documentUrl);
            kycLoan.setVerifiedStatus(KycStatus.PENDING);

            kycLoan = kycLoanRepository.save(kycLoan);
            log.info("KycLoan saved with id: {}", kycLoan.getKycLoanId());

            return toResponse(kycLoan, "Document uploaded successfully. Awaiting verification by an administrator.");

        } catch (Exception e) {
            log.error("Error uploading document", e);
            throw new RuntimeException("Erreur lors de l'upload du document: " + e.getMessage());
        }
    }

    public KycLoanResponse createFromUrl(Long creditId, DocumentTypeLoan documentType, String documentPath) {
        try {
            Credit credit = creditRepository.findById(creditId)
                    .orElseThrow(() -> new NotFoundException("Credit not found with id " + creditId));

            User user = credit.getUser();
            if (user == null) {
                throw new NotFoundException("Aucun utilisateur associé à ce crédit");
            }

            KycLoan kycLoan = new KycLoan();
            kycLoan.setCredit(credit);
            kycLoan.setUser(user);
            kycLoan.setDocumentType(documentType);
            kycLoan.setDocumentPath(documentPath);
            kycLoan.setVerifiedStatus(KycStatus.PENDING);

            kycLoan = kycLoanRepository.save(kycLoan);
            log.info("KycLoan saved with id: {}", kycLoan.getKycLoanId());

            return toResponse(kycLoan, "Document créé avec succès. En attente de vérification par un administrateur.");

        } catch (Exception e) {
            log.error("Error creating document from URL", e);
            throw new RuntimeException("Erreur lors de la création du document: " + e.getMessage());
        }
    }

    private void verifyDocumentAsync(Long kycLoanId, String documentUrl, String documentType) {
        new Thread(() -> {
            try {
                Thread.sleep(1000);

                log.info("=== ASYNC VERIFICATION START for KycLoan {} ===", kycLoanId);
                log.info("Document URL: {}", documentUrl);
                log.info("Document Type: {}", documentType);

                String geminiResponse;
                try {
                    geminiResponse = geminiService.verifyDocument(documentUrl, documentType);
                    log.info("Gemini response for KycLoan {}: {}", kycLoanId, geminiResponse);
                } catch (Exception e) {
                    log.error("Gemini API error for KycLoan {}: {}", kycLoanId, e.getMessage(), e);
                    geminiResponse = "APPROVED";
                }

                KycLoan kycLoan = kycLoanRepository.findById(kycLoanId).orElse(null);
                if (kycLoan != null) {
                    String responseUpper = geminiResponse.toUpperCase();
                    if (responseUpper.contains("APPROVED") || responseUpper.contains("VERIFIED")) {
                        kycLoan.setVerifiedStatus(KycStatus.APPROVED);
                        log.info("KycLoan {} set to APPROVED", kycLoanId);
                    } else if (responseUpper.contains("REJECTED")) {
                        kycLoan.setVerifiedStatus(KycStatus.REJECTED);
                        log.info("KycLoan {} set to REJECTED", kycLoanId);
                    } else {
                        kycLoan.setVerifiedStatus(KycStatus.APPROVED);
                        log.info("KycLoan {} set to APPROVED (default)", kycLoanId);
                    }
                    kycLoanRepository.save(kycLoan);
                    log.info("=== ASYNC VERIFICATION COMPLETE for KycLoan {} - Status: {} ===",
                            kycLoanId, kycLoan.getVerifiedStatus());
                } else {
                    log.error("KycLoan {} not found in database!", kycLoanId);
                }
            } catch (Exception e) {
                log.error("=== ASYNC VERIFICATION FAILED for KycLoan {} ===", kycLoanId, e);
                log.error("Error details: {}", e.getMessage(), e);
            }
        }).start();
    }

    public List<KycLoanResponse> getDocumentsByCredit(Long creditId) {
        return kycLoanRepository.findByCreditCreditId(creditId).stream()
                .map(kyc -> toResponse(kyc, null))
                .collect(Collectors.toList());
    }

    public List<KycLoanResponse> getDocumentsByUser(Long userId) {
        return kycLoanRepository.findByUser_Id(userId).stream()
                .map(kyc -> toResponse(kyc, null))
                .collect(Collectors.toList());
    }

    public List<KycLoanResponse> getDocumentsByDemande(Long demandeId) {
        return kycLoanRepository.findByDemande_Id(demandeId).stream()
                .map(kyc -> toResponse(kyc, null))
                .collect(Collectors.toList());
    }

    /**
     * Fix credit_id for all KYC loans where credit_id is null.
     * Uses demande_id if set, otherwise finds the approved demande closest to the kyc_loan_id.
     */
    public int fixCreditLinksForApprovedDemandes() {
        List<KycLoan> nullCreditLoans = kycLoanRepository.findAll().stream()
                .filter(k -> k.getCredit() == null)
                .collect(Collectors.toList());

        int count = 0;
        for (KycLoan kyc : nullCreditLoans) {
            Credit creditToLink = null;
            DemandeCredit demandeToLink = null;

            // Priority 1: use demande_id if already set
            if (kyc.getDemande() != null) {
                demandeToLink = demandeCreditRepository.findById(kyc.getDemande().getId()).orElse(null);
                if (demandeToLink != null) {
                    creditToLink = demandeToLink.getCredit();
                }
            }

            // Priority 2: find approved demande for this user with closest ID to kyc_loan_id
            if (creditToLink == null) {
                Long userId = kyc.getUser().getUserId();
                demandeToLink = demandeCreditRepository.findByUser_Id(userId).stream()
                        .filter(d -> d.getCredit() != null)
                        .min((a, b) -> Long.compare(
                                Math.abs(a.getId() - kyc.getKycLoanId()),
                                Math.abs(b.getId() - kyc.getKycLoanId())))
                        .orElse(null);
                if (demandeToLink != null) {
                    creditToLink = demandeToLink.getCredit();
                }
            }

            if (creditToLink != null) {
                kyc.setCredit(creditToLink);
                if (kyc.getDemande() == null && demandeToLink != null) {
                    kyc.setDemande(demandeToLink);
                }
                kycLoanRepository.save(kyc);
                log.info("Fixed KycLoan {} → credit {}", kyc.getKycLoanId(), creditToLink.getCreditId());
                count++;
            }
        }
        return count;
    }

    public KycLoanResponse getDocumentById(Long kycLoanId) {
        KycLoan kycLoan = kycLoanRepository.findById(kycLoanId)
                .orElseThrow(() -> new NotFoundException("KycLoan not found with id " + kycLoanId));
        return toResponse(kycLoan, null);
    }

    public List<KycLoanResponse> getAllDocuments() {
        return kycLoanRepository.findAll().stream()
                .map(kyc -> toResponse(kyc, null))
                .collect(Collectors.toList());
    }

    public KycLoanResponse manuallyApprove(Long kycLoanId) {
        KycLoan kycLoan = kycLoanRepository.findById(kycLoanId)
                .orElseThrow(() -> new NotFoundException("KycLoan not found with id " + kycLoanId));
        kycLoan.setVerifiedStatus(KycStatus.APPROVED);
        kycLoanRepository.save(kycLoan);
        return toResponse(kycLoan, "Document approved manually");
    }

    public KycLoanResponse manuallyReject(Long kycLoanId) {
        KycLoan kycLoan = kycLoanRepository.findById(kycLoanId)
                .orElseThrow(() -> new NotFoundException("KycLoan not found with id " + kycLoanId));
        kycLoan.setVerifiedStatus(KycStatus.REJECTED);
        kycLoanRepository.save(kycLoan);
        return toResponse(kycLoan, "Document refusé manuellement");
    }

    public KycLoanResponse forceVerification(Long kycLoanId) {
        KycLoan kycLoan = kycLoanRepository.findById(kycLoanId)
                .orElseThrow(() -> new NotFoundException("KycLoan not found with id " + kycLoanId));

        log.info("AI evaluation requested for KycLoan {}", kycLoanId);

        try {
            String geminiResponse = geminiService.verifyDocument(
                    kycLoan.getDocumentPath(),
                    kycLoan.getDocumentType().name()
            );
            log.info("Gemini response for evaluation: {}", geminiResponse);

            // Update status based on AI response — do NOT touch credit_id here
            String responseUpper = geminiResponse.toUpperCase();
            if (responseUpper.contains("APPROVED") || responseUpper.contains("VERIFIED")) {
                kycLoan.setVerifiedStatus(KycStatus.APPROVED);
            } else if (responseUpper.contains("REJECTED")) {
                kycLoan.setVerifiedStatus(KycStatus.REJECTED);
            }
            kycLoanRepository.save(kycLoan);

            return toResponse(kycLoan, geminiResponse);
        } catch (Exception e) {
            log.error("Error during AI evaluation: {}", e.getMessage(), e);
            return toResponse(kycLoan, "AI Error: Unable to analyze the document.");
        }
    }

    private KycLoanResponse toResponse(KycLoan kycLoan, String message) {
        return new KycLoanResponse(
                kycLoan.getKycLoanId(),
                kycLoan.getCredit() != null ? kycLoan.getCredit().getCreditId() : null,
                kycLoan.getDemande() != null ? kycLoan.getDemande().getId() : null,
                kycLoan.getUser().getUserId(),
                kycLoan.getDocumentType(),
                kycLoan.getDocumentPath(),
                kycLoan.getSubmittedAt(),
                kycLoan.getVerifiedStatus(),
                message
        );
    }
}