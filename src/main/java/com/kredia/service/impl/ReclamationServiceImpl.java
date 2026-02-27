package com.kredia.service.impl;

import com.kredia.dto.ml.RiskFeaturesDto;
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
import com.kredia.service.ReclamationTriggerService;
import com.kredia.service.ml.MlRiskClient;
import com.kredia.service.ml.RiskFeatureExtractorService;
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

    // Notifications / triggers
    private final ReclamationTriggerService triggerService;

    // ML integration
    private final RiskFeatureExtractorService riskFeatureExtractorService;
    private final MlRiskClient mlRiskClient;

    // ---------------- CREATE ----------------
    @Override
    public ReclamationResponse create(ReclamationCreateRequest request) {

        // Create with default priority (ML will decide later)
        Reclamation rec = Reclamation.builder()
                .userId(request.userId())
                .subject(request.subject())
                .description(request.description())
                .status(ReclamationStatus.OPEN)
                .priority(Priority.MEDIUM)   // ML-driven priority
                .riskScore(null)
                .assignedTo(null)
                .build();

        // 1) Save first to get reclamationId
        Reclamation saved = reclamationRepository.save(rec);

        // 2) History: CREATED (actor is the user who created it)
        historyRepository.save(ReclamationHistory.builder()
                .reclamation(saved)
                .userId(request.userId())
                .oldStatus(ReclamationStatus.OPEN)
                .newStatus(ReclamationStatus.OPEN)
                .note("Created")
                .build());

        // 3) Trigger: notify user "received"
        triggerService.onCreated(saved);

        // 4) ML risk scoring (FastAPI)
        double score = 0.0;
        try {
            RiskFeaturesDto features = riskFeatureExtractorService.extract(saved.getUserId(), saved.getDescription());
            score = mlRiskClient.predictRiskScore(features);
        } catch (Exception ignored) {
            // Fallback: app should not crash if ML service is down
        }

        // 5) Store score + set priority from score
        saved.setRiskScore(score);
        saved.setPriority(priorityFromScore(score));

        // 6) Auto-escalation ONLY if score >= 70
        if (score >= 70) {
            ReclamationStatus old = saved.getStatus();
            saved.setStatus(ReclamationStatus.IN_PROGRESS);

            // History: AUTO_ESCALATED (system action => userId MUST be null to avoid FK issue)
            historyRepository.save(ReclamationHistory.builder()
                    .reclamation(saved)
                    .userId(null) // ✅ SYSTEM action (requires reclamation_history.user_id nullable)
                    .oldStatus(old)
                    .newStatus(ReclamationStatus.IN_PROGRESS)
                    .note("AUTO_ESCALATED (ML riskScore=" + (int) score + ")")
                    .build());

            // Trigger: notify supervisor
            triggerService.onEscalated(saved, score, "High ML risk score");
        }

        // 7) Save final updated record (risk_score + maybe status/priority)
        Reclamation finalSaved = reclamationRepository.save(saved);
        return toResponse(finalSaved);
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
        historyRepository.save(ReclamationHistory.builder()
                .reclamation(saved)
                .userId(request.actorUserId())
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .note(request.note())
                .build());

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
        historyRepository.save(ReclamationHistory.builder()
                .reclamation(saved)
                .userId(request.actorUserId())
                .oldStatus(saved.getStatus())
                .newStatus(saved.getStatus())
                .note("Assigned to agent " + request.agentUserId()
                        + (request.note() != null ? " - " + request.note() : ""))
                .build());

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

    /**
     * Priority derived from ML score.
     * <40  -> LOW
     * 40-69-> MEDIUM
     * >=70 -> HIGH
     */
    private Priority priorityFromScore(double score) {
        if (score >= 70) return Priority.HIGH;
        if (score >= 40) return Priority.MEDIUM;
        return Priority.LOW;
    }
}