package com.kredia.service.impl.user;

import com.kredia.entity.user.KycDocument;
import com.kredia.entity.user.User;
import com.kredia.entity.user.UserActivity;
import com.kredia.entity.user.UserActivityActionType;
import com.kredia.entity.user.UserRole;
import com.kredia.enums.DocumentType;
import com.kredia.enums.KycStatus;
import com.kredia.exception.BusinessException;
import com.kredia.exception.ForbiddenException;
import com.kredia.exception.ResourceNotFoundException;
import com.kredia.repository.user.KycDocumentRepository;
import com.kredia.repository.user.UserActivityRepository;
import com.kredia.repository.user.UserRepository;
import com.kredia.service.CloudinaryService;
import com.kredia.service.user.KycDocumentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class KycDocumentServiceImpl implements KycDocumentService {

    private final KycDocumentRepository kycDocumentRepository;
    private final UserRepository userRepository;
    private final UserActivityRepository userActivityRepository;
    private final CloudinaryService cloudinaryService;

    public KycDocumentServiceImpl(KycDocumentRepository kycDocumentRepository,
                                  UserRepository userRepository,
                                  UserActivityRepository userActivityRepository,
                                  CloudinaryService cloudinaryService) {
        this.kycDocumentRepository = kycDocumentRepository;
        this.userRepository = userRepository;
        this.userActivityRepository = userActivityRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @Override
    @Transactional
    public KycDocument uploadDocument(Long actorId, MultipartFile file, DocumentType type) {
        User client = loadUser(actorId);

        try {
            String url = cloudinaryService.uploadFile(file, "kyc_documents/" + actorId);
            
            KycDocument doc = new KycDocument();
            doc.setUser(client);
            doc.setDocumentType(type);
            doc.setFilePath(url);
            doc.setStatus(KycStatus.PENDING);
            KycDocument saved = kycDocumentRepository.save(doc);

            recordActivity(actorId, UserActivityActionType.CREATED, "Uploaded KYC document: " + type.name());
            return saved;
        } catch (IOException e) {
            throw new BusinessException("Failed to upload document to Cloudinary");
        }
    }

    @Override
    @Transactional
    public KycDocument verifyDocument(Long actorId, Long documentId, KycStatus status) {
        User actor = loadUser(actorId);
        if (actor.getRole() == UserRole.CLIENT) {
            throw new ForbiddenException("Clients cannot verify documents");
        }

        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("KYC Document not found: " + documentId));

        User client = doc.getUser();
        if (actor.getRole() == UserRole.AGENT && !Objects.equals(actor, client.getAssignedAgent())) {
            throw new ForbiddenException("Agent can only verify documents of assigned clients");
        }

        doc.setStatus(status);
        if (status == KycStatus.APPROVED || status == KycStatus.REJECTED) {
            doc.setVerifiedAt(LocalDateTime.now());
        }
        
        KycDocument saved = kycDocumentRepository.save(doc);
        
        recordActivity(client.getId(), UserActivityActionType.STATUS_CHANGED, "KYC Document " + doc.getDocumentType() + " status updated to " + status + " by " + actorId);
        
        // Agent metrics
        if (actor.getRole() == UserRole.AGENT) {
            UserActivityActionType agentAction = status == KycStatus.APPROVED ? UserActivityActionType.APPROVAL : UserActivityActionType.REJECTION;
            recordActivity(actorId, agentAction, "Verified KYC " + doc.getDocumentType() + " for client " + client.getId());
        }

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<KycDocument> getDocumentsByUser(Long actorId, Long userId) {
        User actor = loadUser(actorId);
        if (actor.getRole() == UserRole.CLIENT && !actorId.equals(userId)) {
            throw new ForbiddenException("Client can only view their own documents");
        }
        if (actor.getRole() == UserRole.AGENT) {
            User target = loadUser(userId);
            if (!Objects.equals(actor, target.getAssignedAgent())) {
                throw new ForbiddenException("Agent can only view documents of assigned clients");
            }
        }
        return kycDocumentRepository.findByUserId(userId);
    }

    private User loadUser(Long id) {
        return userRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private void recordActivity(Long userId, UserActivityActionType type, String description) {
        UserActivity activity = new UserActivity();
        activity.setUserId(userId);
        activity.setActionType(type);
        activity.setDescription(description);
        activity.setTimestamp(Instant.now());
        userActivityRepository.save(activity);
    }
}
