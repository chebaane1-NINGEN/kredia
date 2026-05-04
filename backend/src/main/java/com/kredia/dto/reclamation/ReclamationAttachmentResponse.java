package com.kredia.dto.reclamation;

import java.time.LocalDateTime;

public record ReclamationAttachmentResponse(
        Long attachmentId,
        String fileName,
        String fileUrl,
        String contentType,
        Long sizeBytes,
        Long uploadedByUserId,
        LocalDateTime uploadedAt
) {}
