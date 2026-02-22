package com.kredia.controller;

import com.kredia.service.GeminiVisionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test/gemini")
public class GeminiTestController {

    private final GeminiVisionService geminiVisionService;

    @Autowired
    public GeminiTestController(GeminiVisionService geminiVisionService) {
        this.geminiVisionService = geminiVisionService;
    }

    /**
     * Test si Gemini peut lire un document depuis une URL
     * 
     * Exemple:
     * POST http://localhost:8081/api/test/gemini/extract
     * Body: { "document_url": "https://res.cloudinary.com/..." }
     */
    @PostMapping("/extract")
    public ResponseEntity<?> testDocumentExtraction(@RequestBody Map<String, String> request) {
        try {
            String documentUrl = request.get("document_url");
            
            if (documentUrl == null || documentUrl.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "document_url is required"));
            }

            String result = geminiVisionService.testDocumentExtraction(documentUrl);
            
            Map<String, Object> response = new HashMap<>();
            response.put("document_url", documentUrl);
            response.put("test_result", result);
            response.put("success", result.startsWith("SUCCESS"));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Test de vérification complète d'un document
     * 
     * Exemple:
     * POST http://localhost:8081/api/test/gemini/verify
     * Body: { 
     *   "document_url": "https://res.cloudinary.com/...",
     *   "document_type": "INCOME_PROOF"
     * }
     */
    @PostMapping("/verify")
    public ResponseEntity<?> testDocumentVerification(@RequestBody Map<String, String> request) {
        try {
            String documentUrl = request.get("document_url");
            String documentType = request.get("document_type");
            
            if (documentUrl == null || documentUrl.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "document_url is required"));
            }
            
            if (documentType == null || documentType.isEmpty()) {
                documentType = "INCOME_PROOF";
            }

            String result = geminiVisionService.verifyDocumentWithVision(documentUrl, documentType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("document_url", documentUrl);
            response.put("document_type", documentType);
            response.put("verification_result", result);
            response.put("is_approved", result.toUpperCase().contains("APPROVED"));
            response.put("is_rejected", result.toUpperCase().contains("REJECTED"));
            response.put("is_error", result.startsWith("ERROR"));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint simple pour vérifier que le contrôleur fonctionne
     */
    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "message", "Gemini test controller is running",
            "endpoints", Map.of(
                "extract", "POST /api/test/gemini/extract - Test document extraction",
                "verify", "POST /api/test/gemini/verify - Test document verification",
                "models", "GET /api/test/gemini/models - List available Gemini models"
            )
        ));
    }
    
    /**
     * Liste les modèles Gemini disponibles pour votre clé API
     * 
     * GET http://localhost:8081/api/test/gemini/models
     */
    @GetMapping("/models")
    public ResponseEntity<?> listModels() {
        try {
            String models = geminiVisionService.listAvailableModels();
            return ResponseEntity.ok(Map.of("models", models));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
}
