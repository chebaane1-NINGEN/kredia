package com.kredia.kyc.service;

import com.kredia.common.UserStatus;
import com.kredia.enums.KycDocumentType;
import com.kredia.enums.KycStatus;
import com.kredia.kyc.dto.KycDocumentDTO;
import com.kredia.kyc.entity.KycDocument;
import com.kredia.kyc.repository.KycRepository;
import com.kredia.user.entity.User;
import com.kredia.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KycService {

    private final KycRepository kycRepository;
    private final UserRepository userRepository;

    @Value("${application.file.upload-dir:uploads/kyc}")
    private String uploadDir;

    @Transactional
    public KycDocumentDTO uploadDocument(Long userId, MultipartFile file, KycDocumentType type) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Create upload directory if not exists
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
        String filename = userId + "_" + type + "_" + UUID.randomUUID() + extension;
        Path filePath = uploadPath.resolve(filename);

        // Save file
        Files.copy(file.getInputStream(), filePath);

        // Create KycDocument
        KycDocument document = new KycDocument();
        document.setUser(user);
        document.setDocumentType(type);
        document.setFilePath(filePath.toString());
        document.setStatus(KycStatus.PENDING);

        return mapToDTO(kycRepository.save(document));
    }

    public List<KycDocumentDTO> getMyDocuments(Long userId) {
        return kycRepository.findByUserUserId(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public UserStatus getKycStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getStatus();
    }

    public List<KycDocumentDTO> getPendingDocuments() {
        return kycRepository.findByStatus(KycStatus.PENDING).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public KycDocumentDTO approveDocument(Long kycId, Long adminId) {
        KycDocument document = kycRepository.findById(kycId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        document.setStatus(KycStatus.APPROVED);
        document.setVerifiedBy(adminId);
        document.setVerifiedAt(LocalDateTime.now());
        KycDocument savedDoc = kycRepository.save(document);

        updateUserStatus(document.getUser());

        return mapToDTO(savedDoc);
    }

    @Transactional
    public KycDocumentDTO rejectDocument(Long kycId, Long adminId) {
        KycDocument document = kycRepository.findById(kycId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        document.setStatus(KycStatus.REJECTED);
        document.setVerifiedBy(adminId);
        document.setVerifiedAt(LocalDateTime.now());

        // Any rejected doc keeps user in PENDING
        User user = document.getUser();
        if (user.getStatus() == UserStatus.VERIFIED) {
            user.setStatus(UserStatus.PENDING);
            userRepository.save(user);
        }

        return mapToDTO(kycRepository.save(document));
    }

    private void updateUserStatus(User user) {
        List<KycDocument> documents = kycRepository.findByUserUserId(user.getUserId());

        boolean hasRejected = documents.stream().anyMatch(d -> d.getStatus() == KycStatus.REJECTED);
        boolean hasPending = documents.stream().anyMatch(d -> d.getStatus() == KycStatus.PENDING);

        if (hasRejected || hasPending) {
            return; // Cannot verify if there are rejected or pending documents
        }

        // Check required documents: CIN or PASSPORT
        boolean hasIdentity = documents.stream()
                .anyMatch(d -> (d.getDocumentType() == KycDocumentType.CIN
                        || d.getDocumentType() == KycDocumentType.PASSPORT)
                        && d.getStatus() == KycStatus.APPROVED);

        if (hasIdentity) {
            user.setStatus(UserStatus.VERIFIED);
            userRepository.save(user);
        }
    }

    private KycDocumentDTO mapToDTO(KycDocument doc) {
        return KycDocumentDTO.builder()
                .kycId(doc.getKycId())
                .userId(doc.getUser().getUserId())
                .documentType(doc.getDocumentType())
                .filePath(doc.getFilePath())
                .status(doc.getStatus())
                .uploadedAt(doc.getUploadedAt())
                .verifiedAt(doc.getVerifiedAt())
                .verifiedBy(doc.getVerifiedBy())
                .build();
    }
}
