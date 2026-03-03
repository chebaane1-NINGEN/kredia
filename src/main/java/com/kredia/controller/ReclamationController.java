package com.kredia.controller;

import com.kredia.dto.reclamation.*;
import com.kredia.enums.ReclamationStatus;
import com.kredia.service.ReclamationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reclamations")
@RequiredArgsConstructor
public class ReclamationController {

    private final ReclamationService reclamationService;

    @PostMapping
    public ReclamationResponse create(@Valid @RequestBody ReclamationCreateRequest request) {
        return reclamationService.create(request);
    }

    @PutMapping("/{id}")
    public ReclamationResponse update(@PathVariable Long id,
                                      @Valid @RequestBody ReclamationUpdateRequest request) {
        return reclamationService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public ReclamationResponse updateStatus(@PathVariable Long id,
                                            @Valid @RequestBody ReclamationStatusUpdateRequest request) {
        return reclamationService.updateStatus(id, request);
    }

    @PatchMapping("/{id}/assign")
    public ReclamationResponse assign(@PathVariable Long id,
                                      @Valid @RequestBody ReclamationAssignRequest request) {
        return reclamationService.assign(id, request);
    }

    @GetMapping("/{id}")
    public ReclamationResponse getById(@PathVariable Long id) {
        return reclamationService.getById(id);
    }

    @GetMapping
    public Page<ReclamationResponse> getAll(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        return reclamationService.getAll(page, size);
    }

    @GetMapping("/{id}/risk")
    public RiskScoreResponse getRisk(@PathVariable Long id) {
        // For now, just return stored riskScore (computed at creation)
        var rec = reclamationService.getById(id);
        return new RiskScoreResponse(rec.reclamationId(), rec.riskScore() != null ? rec.riskScore() : 0, null);
    }


    @GetMapping("/by-user/{userId}")
    public Page<ReclamationResponse> getByUser(@PathVariable Long userId,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size) {
        return reclamationService.getByUser(userId, page, size);
    }

    @GetMapping("/by-status")
    public Page<ReclamationResponse> getByStatus(@RequestParam ReclamationStatus status,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size) {
        return reclamationService.getByStatus(status, page, size);
    }

    @GetMapping("/{id}/history")
    public List<ReclamationHistoryResponse> getHistory(@PathVariable Long id) {
        return reclamationService.getHistory(id);
    }
}
