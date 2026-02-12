package com.kredia.service.impl;

import com.kredia.dto.reclamation.*;
import com.kredia.entity.support.Reclamation;
import com.kredia.entity.support.ReclamationHistory;
import com.kredia.enums.Priority;
import com.kredia.enums.ReclamationStatus;
import com.kredia.exception.BadRequestException;
import com.kredia.exception.NotFoundException;
import com.kredia.repository.ReclamationHistoryRepository;
import com.kredia.repository.ReclamationRepository;
import com.kredia.service.ReclamationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReclamationServiceImpl implements ReclamationService {

    private final ReclamationRepository reclamationRepository;
    private final ReclamationHistoryRepository historyRepository;

    @Override
    public ReclamationResponse create(ReclamationCreateRequest request) {
        Reclamation rec = Reclamation.builder()
                .userId(request.userId())
                .subject(request.subject())
                .description(request.description())
                .status(ReclamationStatus.OPEN)
                .priority(request.priority() != null ? request.priority() : Priority.MEDIUM)
                .riskScore(null) // later ML will fill it
                .build();

        Reclamation saved = reclamationRepository.save(rec);

        // history entry
        historyRepository.save(ReclamationHistory.builder()
                .reclamation(saved)
                .userId(request.userId()) // creator
                .oldStatus(ReclamationStatus.OPEN)
                .newStatus(ReclamationStatus.OPEN)
                .note("Created")
                .build());

        return toResponse(saved);
    }

    @Override
    public ReclamationResponse update(Long reclamationId, ReclamationUpdateRequest request) {
        Reclamation rec = getEntity(reclamationId);

        if (rec.getStatus() == ReclamationStatus.RESOLVED || rec.getStatus() == ReclamationStatus.REJECTED) {
            throw new BadRequestException("Cannot update a closed reclamation");
        }

        rec.setSubject(request.subject());
        rec.setDescription(request.description());
        rec.setPriority(request.priority());

        return toResponse(reclamationRepository.save(rec));
    }

    @Override
    public ReclamationResponse updateStatus(Long reclamationId, ReclamationStatusUpdateRequest request) {
        Reclamation rec = getEntity(reclamationId);

        ReclamationStatus oldStatus = rec.getStatus();
        ReclamationStatus newStatus = request.newStatus();

        validateTransition(oldStatus, newStatus);

        rec.setStatus(newStatus);

        if (newStatus == ReclamationStatus.RESOLVED || newStatus == ReclamationStatus.REJECTED) {
            rec.setResolvedAt(LocalDateTime.now());
        }

        Reclamation saved = reclamationRepository.save(rec);

        historyRepository.save(ReclamationHistory.builder()
                .reclamation(saved)
                .userId(request.actorUserId())
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .note(request.note())
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ReclamationResponse getById(Long reclamationId) {
        return toResponse(getEntity(reclamationId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReclamationResponse> getAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return reclamationRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReclamationResponse> getByUser(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return reclamationRepository.findByUserId(userId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReclamationResponse> getByStatus(ReclamationStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return reclamationRepository.findByStatus(status, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReclamationHistoryResponse> getHistory(Long reclamationId) {
        List<ReclamationHistory> rows = historyRepository
                .findByReclamation_ReclamationIdOrderByChangedAtDesc(reclamationId);

        return rows.stream().map(h -> new ReclamationHistoryResponse(
                h.getHistoryId(),
                h.getUserId(),
                h.getOldStatus(),
                h.getNewStatus(),
                h.getChangedAt(),
                h.getNote()
        )).toList();
    }

    // ---------------- Helpers ----------------
    private Reclamation getEntity(Long id) {
        return reclamationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reclamation not found: " + id));
    }

    private ReclamationResponse toResponse(Reclamation r) {
        return new ReclamationResponse(
                r.getReclamationId(),
                r.getUserId(),
                r.getSubject(),
                r.getDescription(),
                r.getStatus(),
                r.getPriority(),
                r.getRiskScore(),
                r.getCreatedAt(),
                r.getResolvedAt()
        );
    }

    private void validateTransition(ReclamationStatus oldS, ReclamationStatus newS) {
        // Allowed transitions:
        // OPEN -> IN_PROGRESS
        // IN_PROGRESS -> RESOLVED / REJECTED
        // OPEN -> REJECTED (optional)
        if (oldS == newS) return;

        boolean ok =
                (oldS == ReclamationStatus.OPEN && (newS == ReclamationStatus.IN_PROGRESS || newS == ReclamationStatus.REJECTED))
                        || (oldS == ReclamationStatus.IN_PROGRESS && (newS == ReclamationStatus.RESOLVED || newS == ReclamationStatus.REJECTED));

        if (!ok) {
            throw new BadRequestException("Invalid status transition: " + oldS + " -> " + newS);
        }
    }
}
