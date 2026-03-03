package com.kredia.service.impl;

import com.kredia.dto.ml.RiskFeaturesDto;
import com.kredia.dto.reclamation.ReclamationAssignRequest;
import com.kredia.dto.reclamation.ReclamationCreateRequest;
import com.kredia.dto.reclamation.ReclamationHistoryResponse;
import com.kredia.dto.reclamation.ReclamationResponse;
import com.kredia.dto.reclamation.ReclamationStatusUpdateRequest;
import com.kredia.dto.reclamation.ReclamationUpdateRequest;
import com.kredia.entity.support.Reclamation;
import com.kredia.entity.support.ReclamationHistory;
import com.kredia.enums.Priority;
import com.kredia.enums.ReclamationRiskLevel;
import com.kredia.enums.ReclamationStatus;
import com.kredia.exception.BadRequestException;
import com.kredia.exception.NotFoundException;
import com.kredia.repository.ReclamationHistoryRepository;
import com.kredia.repository.ReclamationRepository;
import com.kredia.service.ReclamationService;
import com.kredia.service.ReclamationTriggerService;
import com.kredia.service.ml.MlRiskClient;
import com.kredia.service.ml.RiskFeatureExtractorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class ReclamationServiceImpl implements ReclamationService {

    private final ReclamationRepository reclamationRepository;
    private final ReclamationHistoryRepository historyRepository;

    // Notifications / triggers
    private final ReclamationTriggerService triggerService;

    // ML integration
    private final RiskFeatureExtractorService riskFeatureExtractorService;
    private final MlRiskClient mlRiskClient;

    // ---------------- CREATE ----------------
    @Override
    public ReclamationResponse create(ReclamationCreateRequest request) {
        Priority initialPriority = request.priority() != null ? request.priority() : Priority.MEDIUM;

        Reclamation rec = new Reclamation();
        rec.setUserId(request.userId());
        rec.setSubject(request.subject());
        rec.setDescription(request.description());
        rec.setStatus(ReclamationStatus.OPEN);
        rec.setPriority(initialPriority);
        rec.setRiskScore(null);
        rec.setRiskLevel(ReclamationRiskLevel.LOW);
        rec.setAssignedTo(null);

        // Build model input before insert so past/duplicate stats use historical rows only.
        RiskFeaturesDto modelInput = riskFeatureExtractorService.extract(
                request.userId(),
                request.subject(),
                request.description(),
                ReclamationStatus.OPEN.name(),
                initialPriority.name()
        );

        // 1) Save first to get reclamationId
        Reclamation saved = reclamationRepository.save(rec);

        // 2) History: CREATED (actor is the user who created it)
        ReclamationHistory createdHistory = new ReclamationHistory();
        createdHistory.setReclamation(saved);
        createdHistory.setUserId(request.userId());
        createdHistory.setOldStatus(ReclamationStatus.OPEN);
        createdHistory.setNewStatus(ReclamationStatus.OPEN);
        createdHistory.setNote("Created");
        historyRepository.save(createdHistory);

        // 3) Trigger: notify user "received"
        triggerService.onCreated(saved);

        // 4) ML risk scoring (FastAPI)
        double score = 0.0;
        try {
            log.info(
                    "ML features before /predict: duplicate_count={}, past_reclamations={}, transaction_amount={}, late_credit={}",
                    modelInput.duplicate_count(),
                    modelInput.past_reclamations(),
                    modelInput.transaction_amount(),
                    modelInput.late_credit()
            );
            score = mlRiskClient.predictRiskScore(modelInput);
        } catch (Exception ignored) {
            // Fallback: app should not crash if ML service is down
        }

        // 5) Store score + risk level + set priority from risk level
        ReclamationRiskLevel riskLevel = riskLevelFromScore(score);
        saved.setRiskScore(score);
        saved.setRiskLevel(riskLevel);
        saved.setPriority(priorityFromRiskLevel(riskLevel));
        log.info("ML score persisted for reclamationId={}: score={}, riskLevel={}, priority={}",
                saved.getReclamationId(), score, riskLevel, saved.getPriority());

        // 6) Auto-escalation for HIGH/CRITICAL risk
        if (riskLevel == ReclamationRiskLevel.HIGH || riskLevel == ReclamationRiskLevel.CRITICAL) {
            ReclamationStatus old = saved.getStatus();
            saved.setStatus(ReclamationStatus.IN_PROGRESS);

            // SYSTEM action; userId is null by design.
            ReclamationHistory autoEscalatedHistory = new ReclamationHistory();
            autoEscalatedHistory.setReclamation(saved);
            autoEscalatedHistory.setUserId(null);
            autoEscalatedHistory.setOldStatus(old);
            autoEscalatedHistory.setNewStatus(ReclamationStatus.IN_PROGRESS);
            autoEscalatedHistory.setNote("AUTO_ESCALATED (ML riskScore=" + (int) score + ", level=" + riskLevel + ")");
            historyRepository.save(autoEscalatedHistory);

            triggerService.onEscalated(saved, score, "High ML risk score");
        }

        // 7) Save final updated record (risk_score + risk_level + maybe status/priority)
        Reclamation finalSaved = reclamationRepository.save(saved);
        return toResponse(finalSaved, modelInput);
    }

    // ---------------- UPDATE CONTENT ----------------
    @Override
    public ReclamationResponse update(Long reclamationId, ReclamationUpdateRequest request) {
        Reclamation rec = getEntity(reclamationId);

        if (rec.getStatus() == ReclamationStatus.RESOLVED || rec.getStatus() == ReclamationStatus.REJECTED) {
            throw new BadRequestException("Cannot update a closed reclamation");
        }

        rec.setSubject(request.subject());
        rec.setDescription(request.description());

        // Option: allow manual priority update by agent/admin
        rec.setPriority(request.priority());

        Reclamation saved = reclamationRepository.save(rec);
        return toResponse(saved);
    }

    // ---------------- UPDATE STATUS (workflow + history + notifications) ----------------
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

        // History row (actor is real user -> must exist)
        ReclamationHistory statusHistory = new ReclamationHistory();
        statusHistory.setReclamation(saved);
        statusHistory.setUserId(request.actorUserId());
        statusHistory.setOldStatus(oldStatus);
        statusHistory.setNewStatus(newStatus);
        statusHistory.setNote(request.note());
        historyRepository.save(statusHistory);

        // Notifications
        triggerService.onStatusChanged(saved, oldStatus, newStatus, request.note(), request.actorUserId());

        return toResponse(saved);
    }

    // ---------------- ASSIGN TO AGENT ----------------
    @Override
    public ReclamationResponse assign(Long reclamationId, ReclamationAssignRequest request) {
        Reclamation rec = getEntity(reclamationId);

        if (rec.getStatus() == ReclamationStatus.RESOLVED || rec.getStatus() == ReclamationStatus.REJECTED) {
            throw new BadRequestException("Cannot assign a closed reclamation");
        }

        rec.setAssignedTo(request.agentUserId());
        Reclamation saved = reclamationRepository.save(rec);

        // History: ASSIGNED (actor is real user -> must exist)
        ReclamationHistory assignHistory = new ReclamationHistory();
        assignHistory.setReclamation(saved);
        assignHistory.setUserId(request.actorUserId());
        assignHistory.setOldStatus(saved.getStatus());
        assignHistory.setNewStatus(saved.getStatus());
        assignHistory.setNote("Assigned to agent " + request.agentUserId()
                + (request.note() != null ? " - " + request.note() : ""));
        historyRepository.save(assignHistory);

        // Notify agent (reuse status changed trigger)
        triggerService.onStatusChanged(saved, saved.getStatus(), saved.getStatus(), "Assigned", request.actorUserId());

        return toResponse(saved);
    }

    // ---------------- READ ----------------
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
        List<ReclamationHistory> rows =
                historyRepository.findByReclamation_ReclamationIdOrderByChangedAtDesc(reclamationId);

        return rows.stream().map(h -> new ReclamationHistoryResponse(
                h.getHistoryId(),
                h.getUserId(),          // can be null for SYSTEM action
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
        return toResponse(r, null);
    }

    private ReclamationResponse toResponse(Reclamation r, RiskFeaturesDto modelInput) {
        return new ReclamationResponse(
                r.getReclamationId(),
                r.getUserId(),
                r.getSubject(),
                r.getDescription(),
                r.getStatus(),
                r.getPriority(),
                r.getRiskScore(),
                r.getRiskLevel(),
                r.getCreatedAt(),
                r.getResolvedAt(),
                modelInput
        );
    }

    private void validateTransition(ReclamationStatus oldS, ReclamationStatus newS) {
        if (oldS == newS) return;

        boolean ok =
                (oldS == ReclamationStatus.OPEN &&
                        (newS == ReclamationStatus.IN_PROGRESS || newS == ReclamationStatus.REJECTED))
                        ||
                        (oldS == ReclamationStatus.IN_PROGRESS &&
                                (newS == ReclamationStatus.RESOLVED || newS == ReclamationStatus.REJECTED));

        if (!ok) {
            throw new BadRequestException("Invalid status transition: " + oldS + " -> " + newS);
        }
    }

    private ReclamationRiskLevel riskLevelFromScore(double score) {
        if (score >= 85) return ReclamationRiskLevel.CRITICAL;
        if (score >= 65) return ReclamationRiskLevel.HIGH;
        if (score >= 35) return ReclamationRiskLevel.MEDIUM;
        return ReclamationRiskLevel.LOW;
    }

    private Priority priorityFromRiskLevel(ReclamationRiskLevel riskLevel) {
        if (riskLevel == ReclamationRiskLevel.HIGH || riskLevel == ReclamationRiskLevel.CRITICAL) {
            return Priority.HIGH;
        }
        if (riskLevel == ReclamationRiskLevel.MEDIUM) return Priority.MEDIUM;
        return Priority.LOW;
    }
}
