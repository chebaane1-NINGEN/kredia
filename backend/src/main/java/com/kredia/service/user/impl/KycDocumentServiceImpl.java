package com.kredia.service.user.impl;

import com.kredia.entity.user.KycDocument;
import com.kredia.entity.user.User;
import com.kredia.enums.DocumentType;
import com.kredia.enums.KycStatus;
import com.kredia.repository.user.KycDocumentRepository;
import com.kredia.repository.user.UserRepository;
import com.kredia.service.CloudinaryService;
import com.kredia.service.user.KycDocumentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Transactional
public class KycDocumentServiceImpl implements KycDocumentService {

    private final KycDocumentRepository kycDocumentRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    public KycDocumentServiceImpl(KycDocumentRepository kycDocumentRepository,
                                   UserRepository userRepository,
                                   CloudinaryService cloudinaryService) {
        this.kycDocumentRepository = kycDocumentRepository;
        this.userRepository = userRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @Override
    public KycDocument uploadDocument(Long actorId, MultipartFile file, DocumentType type) {
        User user = userRepository.findByIdAndDeletedFalse(actorId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + actorId));

        String fileUrl;
        try {
            fileUrl = cloudinaryService.uploadFile(file, "kyc");
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload document", e);
        }

        KycDocument doc = new KycDocument();
        doc.setUser(user);
        doc.setDocumentType(type);
        doc.setFilePath(fileUrl);
        doc.setStatus(KycStatus.PENDING);

        return kycDocumentRepository.save(doc);
    }

    @Override
    public KycDocument verifyDocument(Long actorId, Long documentId, KycStatus status) {
        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));
        doc.setStatus(status);
        if (status == KycStatus.APPROVED || status == KycStatus.REJECTED) {
            doc.setVerifiedAt(java.time.LocalDateTime.now());
        }
        return kycDocumentRepository.save(doc);
    }

    @Override
    public List<KycDocument> getDocumentsByUser(Long actorId, Long userId) {
        return kycDocumentRepository.findByUser_Id(userId);
    }
}
