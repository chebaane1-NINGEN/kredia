package com.kredia.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;

@Service
public class GeminiVisionService {

    private static final Logger log = LoggerFactory.getLogger(GeminiVisionService.class);

    @Value("${gemini.api-key}")
    private String apiKey;
    
    @Value("${gemini.model:gemini-1.5-pro}")
    private String modelName;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final Gson gson = new Gson();
    
    /**
     * Liste les modèles Gemini disponibles
     */
    public String listAvailableModels() {
        try {
            // Essayer v1
            String urlV1 = "https://generativelanguage.googleapis.com/v1/models?key=" + apiKey;
            HttpRequest requestV1 = HttpRequest.newBuilder()
                    .uri(URI.create(urlV1))
                    .GET()
                    .build();
            
            HttpResponse<String> responseV1 = httpClient.send(requestV1, HttpResponse.BodyHandlers.ofString());
            
            if (responseV1.statusCode() == 200) {
                return "V1 Models:\n" + responseV1.body();
            } else {
                return "V1 Error: " + responseV1.body();
            }
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    /**
     * Vérifie un document en téléchargeant l'image et en l'envoyant à Gemini Vision
     */
    public String verifyDocumentWithVision(String documentUrl, String documentType) {
        try {
            log.info("Starting Gemini Vision verification for document type: {}", documentType);
            log.info("Document URL: {}", documentUrl);

            // Étape 1: Télécharger l'image depuis l'URL
            byte[] imageBytes = downloadImage(documentUrl);
            log.info("Image downloaded successfully, size: {} bytes", imageBytes.length);

            // Étape 2: Encoder en base64
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            log.info("Image encoded to base64, length: {} characters", base64Image.length());

            // Étape 3: Déterminer le type MIME
            String mimeType = getMimeType(documentUrl);
            log.info("Detected MIME type: {}", mimeType);

            // Étape 4: Construire la requête pour Gemini Vision
            String prompt = buildVerificationPrompt(documentType);
            JsonObject requestBody = buildGeminiVisionRequest(prompt, base64Image, mimeType);

            // Étape 5: Envoyer à Gemini
            String apiUrl = "https://generativelanguage.googleapis.com/v1/models/" + modelName + ":generateContent?key=" + apiKey;
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                    .build();

            log.info("Sending request to Gemini Vision API (model: {})...", modelName);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            log.info("Gemini API response status: {}", response.statusCode());
            log.info("Gemini API response body: {}", response.body());

            if (response.statusCode() != 200) {
                log.error("Gemini API error: {}", response.body());
                return "ERROR: Gemini API returned status " + response.statusCode();
            }

            // Étape 6: Parser la réponse
            String result = parseGeminiResponse(response.body());
            log.info("Parsed result: {}", result);

            return result;

        } catch (Exception e) {
            log.error("Error during Gemini Vision verification: {}", e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Télécharge l'image depuis l'URL
     */
    private byte[] downloadImage(String imageUrl) throws IOException {
        log.info("Downloading image from: {}", imageUrl);
        
        try {
            // Convertir l'URL Cloudinary "raw" en URL d'image si nécessaire
            String processedUrl = processCloudinaryUrl(imageUrl);
            log.info("Processed URL: {}", processedUrl);
            
            URL url = new URL(processedUrl);
            try (InputStream in = url.openStream()) {
                byte[] bytes = in.readAllBytes();
                log.info("Successfully downloaded {} bytes", bytes.length);
                return bytes;
            }
        } catch (Exception e) {
            log.error("Failed to download image from {}: {}", imageUrl, e.getMessage());
            throw new IOException("Cannot download image: " + e.getMessage(), e);
        }
    }
    
    /**
     * Convertit une URL Cloudinary "raw" en URL d'image accessible
     */
    private String processCloudinaryUrl(String url) {
        // Si c'est une URL "raw/upload", la convertir en "image/upload" pour les images
        if (url.contains("/raw/upload/")) {
            // Vérifier si c'est un PDF
            if (url.toLowerCase().endsWith(".pdf")) {
                // Pour les PDF, convertir en image (première page)
                String convertedUrl = url.replace("/raw/upload/", "/image/upload/f_jpg,pg_1/");
                log.info("Converting PDF URL to image: {} -> {}", url, convertedUrl);
                return convertedUrl;
            } else {
                // Pour les images, juste changer raw en image
                String convertedUrl = url.replace("/raw/upload/", "/image/upload/");
                log.info("Converting raw URL to image: {} -> {}", url, convertedUrl);
                return convertedUrl;
            }
        }
        return url;
    }

    /**
     * Détermine le type MIME basé sur l'extension du fichier
     */
    private String getMimeType(String url) {
        String lowerUrl = url.toLowerCase();
        
        // Si l'URL a été convertie avec f_jpg, c'est du JPEG
        if (lowerUrl.contains("f_jpg")) {
            return "image/jpeg";
        }
        
        if (lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerUrl.endsWith(".png")) {
            return "image/png";
        } else if (lowerUrl.endsWith(".pdf")) {
            // Si c'est un PDF, on va le convertir en image
            return "image/jpeg";
        } else if (lowerUrl.endsWith(".webp")) {
            return "image/webp";
        }
        
        // Par défaut, considérer comme JPEG
        return "image/jpeg";
    }

    /**
     * Construit le prompt de vérification
     */
    private String buildVerificationPrompt(String documentType) {
        return String.format(
            "Tu es un expert en vérification de documents KYC pour une banque. " +
            "Analyse ce document de type '%s' et vérifie:\n" +
            "1. Le document est-il lisible et de bonne qualité?\n" +
            "2. Contient-il les informations nécessaires (nom, montant, date, etc.)?\n" +
            "3. Le document semble-t-il authentique?\n\n" +
            "Réponds UNIQUEMENT par:\n" +
            "- 'APPROVED: [raison courte]' si le document est valide\n" +
            "- 'REJECTED: [raison courte]' si le document est invalide\n\n" +
            "Sois strict mais raisonnable dans ton évaluation.",
            documentType
        );
    }

    /**
     * Construit la requête JSON pour Gemini Vision
     */
    private JsonObject buildGeminiVisionRequest(String prompt, String base64Image, String mimeType) {
        JsonObject requestBody = new JsonObject();
        
        // Créer le tableau de contents
        JsonArray contents = new JsonArray();
        JsonObject content = new JsonObject();
        
        // Créer le tableau de parts (texte + image)
        JsonArray parts = new JsonArray();
        
        // Part 1: Le texte du prompt
        JsonObject textPart = new JsonObject();
        textPart.addProperty("text", prompt);
        parts.add(textPart);
        
        // Part 2: L'image en base64
        JsonObject imagePart = new JsonObject();
        JsonObject inlineData = new JsonObject();
        inlineData.addProperty("mime_type", mimeType);
        inlineData.addProperty("data", base64Image);
        imagePart.add("inline_data", inlineData);
        parts.add(imagePart);
        
        content.add("parts", parts);
        contents.add(content);
        requestBody.add("contents", contents);
        
        return requestBody;
    }

    /**
     * Parse la réponse de Gemini
     */
    private String parseGeminiResponse(String responseBody) {
        try {
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);
            
            // Vérifier s'il y a une erreur
            if (jsonResponse.has("error")) {
                JsonObject error = jsonResponse.getAsJsonObject("error");
                String errorMessage = error.get("message").getAsString();
                log.error("Gemini API error: {}", errorMessage);
                return "ERROR: " + errorMessage;
            }
            
            // Extraire le texte de la réponse
            String text = jsonResponse.getAsJsonArray("candidates")
                    .get(0).getAsJsonObject()
                    .getAsJsonObject("content")
                    .getAsJsonArray("parts")
                    .get(0).getAsJsonObject()
                    .get("text").getAsString();
            
            return text.trim();
        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage(), e);
            return "ERROR: Unable to parse Gemini response - " + e.getMessage();
        }
    }

    /**
     * Méthode de test pour vérifier si Gemini peut lire le document
     */
    public String testDocumentExtraction(String documentUrl) {
        try {
            log.info("=== TEST: Document Extraction ===");
            log.info("URL: {}", documentUrl);

            // Test 1: Téléchargement
            byte[] imageBytes = downloadImage(documentUrl);
            log.info("✓ Download successful: {} bytes", imageBytes.length);

            // Test 2: Encodage base64
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            log.info("✓ Base64 encoding successful: {} chars", base64Image.length());

            // Test 3: Type MIME
            String mimeType = getMimeType(documentUrl);
            log.info("✓ MIME type detected: {}", mimeType);

            // Test 4: Requête simple à Gemini
            String simplePrompt = "Décris ce que tu vois dans cette image en quelques mots.";
            JsonObject requestBody = buildGeminiVisionRequest(simplePrompt, base64Image, mimeType);
            
            String apiUrl = "https://generativelanguage.googleapis.com/v1/models/" + modelName + ":generateContent?key=" + apiKey;
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            log.info("✓ Gemini API response status: {}", response.statusCode());
            
            if (response.statusCode() == 200) {
                String result = parseGeminiResponse(response.body());
                log.info("✓ Gemini can read the document!");
                log.info("Gemini says: {}", result);
                return "SUCCESS: Gemini can read the document. Response: " + result;
            } else {
                log.error("✗ Gemini API error: {}", response.body());
                return "ERROR: Gemini API returned status " + response.statusCode() + " - " + response.body();
            }

        } catch (Exception e) {
            log.error("✗ Test failed: {}", e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }
}
