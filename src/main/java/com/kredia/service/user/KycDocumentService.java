package com.kredia.service.user;

import com.kredia.entity.user.KycDocument;
import com.kredia.enums.DocumentType;
import com.kredia.enums.KycStatus;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface KycDocumentService {
    KycDocument uploadDocument(Long actorId, MultipartFile file, DocumentType type);
    KycDocument verifyDocument(Long actorId, Long documentId, KycStatus status);
    List<KycDocument> getDocumentsByUser(Long actorId, Long userId);
}
