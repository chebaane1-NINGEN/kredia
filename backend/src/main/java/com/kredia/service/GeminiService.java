package com.kredia.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
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
import java.time.LocalDate;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

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
     * Génère un résumé stratégique des marchés mondiaux au format JSON strict.
     *
     * @param language Langue de sortie (ex: "fr", "en")
     * @param tone Ton attendu (ex: "professionnel, factuel et nuancé")
     * @param additionalContext Contexte additionnel optionnel
     * @return Objet JSON sérialisable pour l'API REST
     */
    public Map<String, Object> generateStrategicMarketSummaryJson(String language, String tone, String additionalContext) {
        log.info("Generating strategic market summary with Gemini {}", modelName);

        try {
            String effectiveLanguage = (language == null || language.isBlank()) ? "fr" : language.trim();
            String effectiveTone = (tone == null || tone.isBlank())
                    ? "professionnel, factuel et nuancé"
                    : tone.trim();
            String effectiveAdditionalContext = additionalContext == null ? "" : additionalContext.trim();

            String prompt = buildStrategicMarketPrompt(effectiveLanguage, effectiveTone, effectiveAdditionalContext);
            JsonObject requestBody = buildGeminiTextRequest(prompt);

            String apiUrlV1 = "https://generativelanguage.googleapis.com/v1/models/" + modelName + ":generateContent?key=" + apiKey;
            HttpResponse<String> response = sendGeminiRequest(apiUrlV1, requestBody);

            if (response.statusCode() != 200) {
                log.warn("Gemini API v1 request failed (market summary), retrying with relaxed payload and v1beta. Status={}, body={}",
                        response.statusCode(), response.body());

                JsonObject relaxedRequestBody = buildGeminiBasicTextRequest(prompt);
                String apiUrlV1beta = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;
                response = sendGeminiRequest(apiUrlV1beta, relaxedRequestBody);
            }

            if (response.statusCode() != 200) {
                log.error("Gemini API error (market summary): {}", response.body());
                throw new RuntimeException("Gemini API returned status " + response.statusCode() + ": " + extractGeminiError(response.body()));
            }

            String rawText = parseGeminiResponse(response.body());
            String cleaned = stripCodeFences(rawText);

            Map<String, Object> parsed = gson.fromJson(cleaned, new TypeToken<Map<String, Object>>() {}.getType());
            if (parsed == null || parsed.isEmpty()) {
                throw new RuntimeException("Gemini returned empty JSON response");
            }

            parsed.putIfAbsent("as_of", LocalDate.now().toString());
            parsed.putIfAbsent("source", "gemini");
            parsed.putIfAbsent("model", modelName);

            return parsed;

        } catch (Exception e) {
            log.error("Failed to generate strategic market summary: {}", e.getMessage(), e);
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("as_of", LocalDate.now().toString());
            fallback.put("source", "gemini");
            fallback.put("model", modelName);
            fallback.put("status", "error");
            fallback.put("message", "Unable to generate market summary at the moment");
            fallback.put("details", e.getMessage());
            return fallback;
        }
    }

    private HttpResponse<String> sendGeminiRequest(String apiUrl, JsonObject requestBody) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                .build();

        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

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
            byte[] imageBytes = downloadImage(documentUrl);
            log.info("Image downloaded successfully, size: {} bytes", imageBytes.length);

            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            String mimeType = getMimeType(documentUrl);

            String prompt = buildVerificationPrompt(documentType);
            JsonObject requestBody = buildGeminiRequest(prompt, base64Image, mimeType);

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
        if (url.toLowerCase().endsWith(".pdf")) {
            // Remplacer "raw/upload/" par "image/upload/" si nécessaire
            if (url.contains("/raw/upload/")) {
                url = url.replace("/raw/upload/", "/image/upload/");
            }
            // Insérer la transformation de format PDF vers JPG page 1
            if (url.contains("/upload/v")) {
                return url.replace("/upload/v", "/upload/f_jpg,pg_1/v");
            } else if (url.contains("/upload/")) {
                return url.replace("/upload/", "/upload/f_jpg,pg_1/");
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
                "You are a KYC document verification expert for a bank. " +
                        "Analyze this document of type '%s' and verify:\n" +
                        "1. Is the document readable and of good quality?\n" +
                        "2. Does it contain the necessary information (name, amount, date, etc.)?\n" +
                        "3. Does the document appear authentic?\n\n" +
                        "Reply ONLY with:\n" +
                        "- 'APPROVED: [short reason]' if the document is valid\n" +
                        "- 'REJECTED: [short reason]' if the document is invalid\n\n" +
                        "Be strict but reasonable in your evaluation. Answer in English.",
                documentType
        );
    }

    /**
     * Analyse la description du client et recommande le meilleur type de remboursement.
     */
    public String recommendRepaymentType(String clientDescription) {
        log.info("Requesting repayment type recommendation from Gemini...");

        try {
            String prompt = buildRecommendationPrompt(clientDescription);
            
            JsonObject requestBody = new JsonObject();
            JsonArray contents = new JsonArray();
            JsonObject content = new JsonObject();
            JsonArray parts = new JsonArray();
            JsonObject textPart = new JsonObject();
            
            textPart.addProperty("text", prompt);
            parts.add(textPart);
            content.add("parts", parts);
            contents.add(content);
            requestBody.add("contents", contents);

            String apiUrl = "https://generativelanguage.googleapis.com/v1/models/" + modelName + ":generateContent?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini API error: {}", response.body());
                return "Une erreur (" + response.statusCode() + ") est survenue avec l'IA: " + response.body();
            }

            return parseGeminiResponse(response.body());

        } catch (Exception e) {
            log.error("Gemini recommendation failed: {}", e.getMessage(), e);
            return "Désolé, je ne peux pas formuler de recommandation pour le moment.";
        }
    }

    /**
     * Construit le prompt pour la recommandation du type de remboursement.
     */
    private String buildRecommendationPrompt(String description) {
        return "Tu es un conseiller financier expert en crédit. " +
               "Un client te décrit sa situation financière, ses besoins et ses revenus/charges ainsi:\n\"" + description + "\"\n\n" +
               "Basé de manière stricte sur cette description, recommande-lui le meilleur type de remboursement parmi ces trois options EXACTES:\n\n" +
               "1. AMORTISSEMENT_CONSTANT : Le client rembourse une part fixe du capital emprunté chaque mois. Les intérêts diminuent avec le temps, donc les mensualités baissent progressivement. Idéal pour ceux qui veulent payer moins d'intérêts au global et peuvent assumer des grosses mensualités au début.\n" +
               "2. MENSUALITE_CONSTANTE : Le client paie exactement le même montant total chaque mois (capital + intérêts cumulés). La part d'intérêts diminue et la part de capital augmente avec le temps. Idéal pour ceux qui veulent de la prévisibilité et un budget mensuel fixe.\n" +
               "3. IN_FINE : Le client ne paie que les intérêts pendant toute la durée du crédit, et rembourse l'intégralité du capital emprunté en une seule fois à la toute dernière échéance. Idéal pour les investissements (ex: locatif) avec une grosse rentrée d'argent ou une revente prévue à la fin.\n\n" +
               "Ta réponse doit d'abord nommer l'option EXACTE en majuscule, puis expliquer de manière claire, empathique et concise pourquoi ce choix est le plus adapté pour sa situation particulière. Ne mentionne pas d'autres types de crédits existants hors de ces 3 choix.";
    }

    /**
     * Construit la requête JSON pour Gemini Vision
     */
    private JsonObject buildGeminiRequest(String prompt, String base64Image, String mimeType) {
        JsonObject requestBody = new JsonObject();

        JsonArray contents = new JsonArray();
        JsonObject content = new JsonObject();
        JsonArray parts = new JsonArray();

        JsonObject textPart = new JsonObject();
        textPart.addProperty("text", prompt);
        parts.add(textPart);

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
     * Construit une requête texte avec contrainte de sortie JSON.
     */
    private JsonObject buildGeminiTextRequest(String prompt) {
        JsonObject requestBody = new JsonObject();

        JsonArray contents = new JsonArray();
        JsonObject content = new JsonObject();
        JsonArray parts = new JsonArray();

        JsonObject textPart = new JsonObject();
        textPart.addProperty("text", prompt);
        parts.add(textPart);

        content.add("parts", parts);
        contents.add(content);
        requestBody.add("contents", contents);

        JsonObject generationConfig = new JsonObject();
        generationConfig.addProperty("temperature", 0.2);
        generationConfig.addProperty("topP", 0.9);
        generationConfig.addProperty("responseMimeType", "application/json");
        requestBody.add("generationConfig", generationConfig);

        return requestBody;
    }

    /**
     * Requête texte minimale (sans generationConfig) pour compatibilité maximale.
     */
    private JsonObject buildGeminiBasicTextRequest(String prompt) {
        JsonObject requestBody = new JsonObject();

        JsonArray contents = new JsonArray();
        JsonObject content = new JsonObject();
        JsonArray parts = new JsonArray();

        JsonObject textPart = new JsonObject();
        textPart.addProperty("text", prompt);
        parts.add(textPart);

        content.add("parts", parts);
        contents.add(content);
        requestBody.add("contents", contents);

        return requestBody;
    }

    private String extractGeminiError(String responseBody) {
        try {
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);
            if (jsonResponse != null && jsonResponse.has("error")) {
                JsonObject error = jsonResponse.getAsJsonObject("error");
                if (error.has("message")) {
                    return error.get("message").getAsString();
                }
            }
        } catch (Exception ignored) {
            // no-op: return raw body fallback below
        }
        return responseBody;
    }

    /**
     * Prompt structuré pour imposer un JSON exploitable côté backend.
     */
    private String buildStrategicMarketPrompt(String language, String tone, String additionalContext) {
        String contextBlock = additionalContext.isBlank()
                ? ""
                : "Contexte additionnel à prendre en compte: " + additionalContext + "\n";

        return "Tu es un analyste macro-financier senior. " +
                "Date de référence: " + LocalDate.now() + ". " +
                "Rédige un résumé stratégique des marchés mondiaux en langue '" + language +
                "' avec un ton '" + tone + "'.\n" +
                contextBlock +
                "IMPORTANT: réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks, sans texte hors JSON.\n" +
                "Si une donnée chiffrée n'est pas disponible de façon fiable, mets null et explique brièvement dans notes.\n" +
                "Le JSON doit respecter EXACTEMENT cette structure (mêmes clés):\n" +
                "{\n" +
                "  \"as_of\": \"YYYY-MM-DD\",\n" +
                "  \"market_equities\": {\n" +
                "    \"summary\": \"string\",\n" +
                "    \"major_indices\": [\n" +
                "      {\"name\": \"string\", \"trend\": \"bullish|neutral|bearish\", \"change_1d_pct\": number_or_null, \"change_ytd_pct\": number_or_null}\n" +
                "    ],\n" +
                "    \"tech_ai_vs_traditional\": {\n" +
                "      \"tech_ai\": {\"momentum\": \"string\", \"valuation_signal\": \"string\"},\n" +
                "      \"traditional\": {\"momentum\": \"string\", \"valuation_signal\": \"string\"}\n" +
                "    }\n" +
                "  },\n" +
                "  \"bond_market\": {\n" +
                "    \"summary\": \"string\",\n" +
                "    \"yield_curves\": [\n" +
                "      {\"region\": \"string\", \"y2\": number_or_null, \"y10\": number_or_null, \"slope_bps\": number_or_null, \"shape\": \"normal|flat|inverted|mixed\"}\n" +
                "    ],\n" +
                "    \"credit_spreads\": {\"investment_grade_bps\": number_or_null, \"high_yield_bps\": number_or_null, \"signal\": \"string\"}\n" +
                "  },\n" +
                "  \"macro_political_factors\": {\n" +
                "    \"inflation\": {\"trend\": \"string\", \"last_value_pct\": number_or_null, \"impact\": \"string\"},\n" +
                "    \"employment\": {\"trend\": \"string\", \"last_unemployment_pct\": number_or_null, \"impact\": \"string\"},\n" +
                "    \"geopolitics\": [\n" +
                "      {\"theme\": \"string\", \"market_impact\": \"string\", \"severity\": \"low|medium|high\"}\n" +
                "    ],\n" +
                "    \"policy_events\": [\"string\"],\n" +
                "    \"notes\": \"string\"\n" +
                "  },\n" +
                "  \"outlook_6_12m\": {\n" +
                "    \"base_case\": \"string\",\n" +
                "    \"bull_case\": \"string\",\n" +
                "    \"bear_case\": \"string\",\n" +
                "    \"portfolio_implications\": [\"string\"]\n" +
                "  },\n" +
                "  \"risk_flags\": [\"string\"],\n" +
                "  \"confidence\": {\"score_0_1\": number_or_null, \"notes\": \"string\"}\n" +
                "}";
    }

    private String stripCodeFences(String text) {
        if (text == null) {
            return "";
        }

        String trimmed = text.trim();
        if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline > -1) {
                trimmed = trimmed.substring(firstNewline + 1, trimmed.length() - 3).trim();
            }
        }
        return trimmed;
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