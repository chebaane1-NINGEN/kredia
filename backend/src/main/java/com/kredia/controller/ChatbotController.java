package com.kredia.controller;

import com.kredia.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final GeminiService geminiService;

    public ChatbotController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/recommend-repayment")
    public ResponseEntity<Map<String, String>> recommendRepaymentTypes(@RequestBody Map<String, String> payload) {
        String description = payload.get("description");
        if (description == null || description.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "La description est requise."));
        }

        String recommendation = geminiService.recommendRepaymentType(description);
        return ResponseEntity.ok(Map.of("recommendation", recommendation));
    }
}
