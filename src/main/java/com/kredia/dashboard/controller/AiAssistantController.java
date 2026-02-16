package com.kredia.dashboard.controller;

import com.kredia.dashboard.service.AiAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard/ai")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AiAssistantController {

    private final AiAssistantService aiAssistantService;

    @PostMapping("/query")
    public ResponseEntity<AiAssistantService.AiResponse> query(@RequestBody Map<String, String> request) {
        String prompt = request.get("prompt");
        if (prompt == null || prompt.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(aiAssistantService.processQuery(prompt));
    }
}
