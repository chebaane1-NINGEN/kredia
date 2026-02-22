package com.kredia.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class GeminiAIService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAIService.class);

    @Value("${gemini.api-key}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final Gson gson = new Gson();
    
    private final GeminiVisionService geminiVisionService;
    
    @Autowired
    public GeminiAIService(GeminiVisionService geminiVisionService) {
        this.geminiVisionService = geminiVisionService;
    }

    public String verifyDocument(String documentUrl, String documentType) {
        // MODE PRODUCTION: Utiliser Gemini Vision pour vérifier les documents
        log.info("GEMINI VERIFICATION MODE: Verifying document type {} with Gemini 2.5 Flash", documentType);
        
        try {
            return geminiVisionService.verifyDocumentWithVision(documentUrl, documentType);
        } catch (Exception e) {
            log.error("Gemini verification failed, falling back to manual review: {}", e.getMessage());
            return "PENDING: Verification failed, manual review required - " + e.getMessage();
        }
    }

    private String buildPrompt(String documentType, String documentUrl) {
        return String.format(
                "Analyse ce document de type '%s' accessible à l'URL: %s. " +
                "Vérifie si le document est valide, lisible et contient les informations nécessaires. " +
                "Réponds par 'APPROVED' si le document est valide, 'REJECTED' si invalide, " +
                "suivi d'une brève explication.",
                documentType, documentUrl
        );
    }

    private String parseGeminiResponse(String responseBody) {
        try {
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);
            return jsonResponse.getAsJsonArray("candidates")
                    .get(0).getAsJsonObject()
                    .getAsJsonObject("content")
                    .getAsJsonArray("parts")
                    .get(0).getAsJsonObject()
                    .get("text").getAsString();
        } catch (Exception e) {
            return "Impossible de parser la réponse de Gemini";
        }
    }
}
