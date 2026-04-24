package com.kredia.controller;

import com.kredia.dto.reclamation.*;
import com.kredia.enums.ReclamationStatus;
import com.kredia.service.ReclamationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/reclamations")
public class ReclamationController {

    private final ReclamationService reclamationService;

    public ReclamationController(ReclamationService reclamationService) {
        this.reclamationService = reclamationService;
    }

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

    @GetMapping("/dashboard")
    public ReclamationDashboardResponse dashboard() {
        return reclamationService.getDashboard();
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

    @PostMapping("/{id}/messages")
    public ReclamationMessageResponse addMessage(@PathVariable Long id,
                                                 @Valid @RequestBody ReclamationMessageCreateRequest request) {
        return reclamationService.addMessage(id, request);
    }

    @GetMapping("/{id}/messages")
    public List<ReclamationMessageResponse> getMessages(@PathVariable Long id,
                                                        @RequestParam(defaultValue = "false") boolean includeInternal) {
        return reclamationService.getMessages(id, includeInternal);
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ReclamationAttachmentResponse addAttachment(@PathVariable Long id,
                                                       @RequestParam Long uploadedByUserId,
                                                       @RequestPart MultipartFile file) {
        return reclamationService.addAttachment(id, uploadedByUserId, file);
    }

    @GetMapping("/{id}/attachments")
    public List<ReclamationAttachmentResponse> getAttachments(@PathVariable Long id) {
        return reclamationService.getAttachments(id);
    }

    @PostMapping("/{id}/feedback")
    public ReclamationResponse submitFeedback(@PathVariable Long id,
                                              @Valid @RequestBody ReclamationFeedbackRequest request) {
        return reclamationService.submitFeedback(id, request);
    }

    @GetMapping("/{id}/duplicates")
    public List<ReclamationResponse> getDuplicateCandidates(@PathVariable Long id) {
        return reclamationService.getDuplicateCandidates(id);
    }
}
