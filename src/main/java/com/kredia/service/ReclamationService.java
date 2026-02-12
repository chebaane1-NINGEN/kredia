package com.kredia.service;

import com.kredia.dto.reclamation.*;
import com.kredia.enums.ReclamationStatus;
import org.springframework.data.domain.Page;

public interface ReclamationService {
    ReclamationResponse create(ReclamationCreateRequest request);

    ReclamationResponse update(Long reclamationId, ReclamationUpdateRequest request);

    ReclamationResponse updateStatus(Long reclamationId, ReclamationStatusUpdateRequest request);

    ReclamationResponse getById(Long reclamationId);

    Page<ReclamationResponse> getAll(int page, int size);

    Page<ReclamationResponse> getByUser(Long userId, int page, int size);

    Page<ReclamationResponse> getByStatus(ReclamationStatus status, int page, int size);

    java.util.List<ReclamationHistoryResponse> getHistory(Long reclamationId);
}
