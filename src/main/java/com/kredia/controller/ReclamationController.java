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

    // 1) Create
    @PostMapping
    public ReclamationResponse create(@Valid @RequestBody ReclamationCreateRequest request) {
        return reclamationService.create(request);
    }

    // 2) Update subject/description/priority
    @PutMapping("/{id}")
    public ReclamationResponse update(@PathVariable Long id,
                                      @Valid @RequestBody ReclamationUpdateRequest request) {
        return reclamationService.update(id, request);
    }

    // 3) Change status (writes history automatically)
    @PatchMapping("/{id}/status")
    public ReclamationResponse updateStatus(@PathVariable Long id,
                                            @Valid @RequestBody ReclamationStatusUpdateRequest request) {
        return reclamationService.updateStatus(id, request);
    }

    // 4) Get by id
    @GetMapping("/{id}")
    public ReclamationResponse getById(@PathVariable Long id) {
        return reclamationService.getById(id);
    }

    // 5) Get all (pagination)
    @GetMapping
    public Page<ReclamationResponse> getAll(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        return reclamationService.getAll(page, size);
    }

    // 6) Filter by user
    @GetMapping("/by-user/{userId}")
    public Page<ReclamationResponse> getByUser(@PathVariable Long userId,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size) {
        return reclamationService.getByUser(userId, page, size);
    }

    // 7) Filter by status
    @GetMapping("/by-status")
    public Page<ReclamationResponse> getByStatus(@RequestParam ReclamationStatus status,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size) {
        return reclamationService.getByStatus(status, page, size);
    }

    // 8) Get history
    @GetMapping("/{id}/history")
    public List<ReclamationHistoryResponse> getHistory(@PathVariable Long id) {
        return reclamationService.getHistory(id);
    }
}
