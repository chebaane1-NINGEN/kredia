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

/**
 * Service de vérification de documents KYC avec Gemini Vision API
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String modelName;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final Gson gson = new Gson();

    /**
     * Vérifie un document KYC avec Gemini Vision
     *
     * @param documentUrl URL du document à vérifier
     * @param documentType Type de document (INCOME_PROOF, ID_PROOF, etc.)
     * @return Résultat de la vérification (APPROVED: ... ou REJECTED: ...)
     */
    public String verifyDocument(String documentUrl, String documentType) {
        log.info("Verifying document type {} with Gemini {}", documentType, modelName);

        try {
            // Télécharger l'image
            byte[] imageBytes = downloadImage(documentUrl);
            log.info("Image downloaded successfully, size: {} bytes", imageBytes.length);

            // Encoder en base64
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            // Déterminer le type MIME
            String mimeType = getMimeType(documentUrl);

            // Construire la requête pour Gemini Vision
            String prompt = buildVerificationPrompt(documentType);
            JsonObject requestBody = buildGeminiRequest(prompt, base64Image, mimeType);

            // Envoyer à Gemini
            String apiUrl = "https://generativelanguage.googleapis.com/v1/models/" + modelName + ":generateContent?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                    .build();

            log.info("Sending request to Gemini API...");
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini API error: {}", response.body());
                return "ERROR: Gemini API returned status " + response.statusCode();
            }

            String result = parseGeminiResponse(response.body());
            log.info("Verification result: {}", result);

            return result;

        } catch (Exception e) {
            log.error("Gemini verification failed: {}", e.getMessage(), e);
            return "ERROR: " + e.getMessage();
        }
    }

    /**
     * Télécharge l'image depuis l'URL
     */
    private byte[] downloadImage(String imageUrl) throws IOException {
        log.info("Downloading image from: {}", imageUrl);

        try {
            String processedUrl = processCloudinaryUrl(imageUrl);
            log.info("Processed URL: {}", processedUrl);

            URL url = new URL(processedUrl);
            try (InputStream in = url.openStream()) {
                byte[] bytes = in.readAllBytes();
                log.info("Successfully downloaded {} bytes", bytes.length);
                return bytes;
            }
        } catch (Exception e) {
            log.error("Failed to download image: {}", e.getMessage());
            throw new IOException("Cannot download image: " + e.getMessage(), e);
        }
    }

    /**
     * Convertit une URL Cloudinary "raw" en URL d'image accessible
     */
    private String processCloudinaryUrl(String url) {
        if (url.contains("/raw/upload/")) {
            if (url.toLowerCase().endsWith(".pdf")) {
                // Pour les PDF, convertir en image (première page)
                return url.replace("/raw/upload/", "/image/upload/f_jpg,pg_1/");
            } else {
                // Pour les images, juste changer raw en image
                return url.replace("/raw/upload/", "/image/upload/");
            }
        }
        return url;
    }

    /**
     * Détermine le type MIME basé sur l'extension du fichier
     */
    private String getMimeType(String url) {
        String lowerUrl = url.toLowerCase();

        if (lowerUrl.contains("f_jpg") || lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerUrl.endsWith(".png")) {
            return "image/png";
        } else if (lowerUrl.endsWith(".webp")) {
            return "image/webp";
        } else if (lowerUrl.endsWith(".pdf")) {
            return "image/jpeg"; // PDF converti en JPG
        }

        return "image/jpeg"; // Par défaut
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
    private JsonObject buildGeminiRequest(String prompt, String base64Image, String mimeType) {
        JsonObject requestBody = new JsonObject();

        JsonArray contents = new JsonArray();
        JsonObject content = new JsonObject();
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

            if (jsonResponse.has("error")) {
                JsonObject error = jsonResponse.getAsJsonObject("error");
                String errorMessage = error.get("message").getAsString();
                log.error("Gemini API error: {}", errorMessage);
                return "ERROR: " + errorMessage;
            }

            String text = jsonResponse.getAsJsonArray("candidates")
                    .get(0).getAsJsonObject()
                    .getAsJsonObject("content")
                    .getAsJsonArray("parts")
                    .get(0).getAsJsonObject()
                    .get("text").getAsString();

            return text.trim();
        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage());
            return "ERROR: Unable to parse Gemini response";
        }
    }
}