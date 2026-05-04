package com.kredia.controller;

import com.kredia.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/speech")
public class SpeechController {

    private final GeminiService geminiService;

    public SpeechController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    /**
     * Receives a recorded audio blob from the browser (WebM/OGG),
     * sends it to Gemini for transcription, and returns the transcript.
     */
    @PostMapping("/transcribe")
    public ResponseEntity<Map<String, String>> transcribe(
            @RequestParam("audio") MultipartFile audioFile) {

        if (audioFile == null || audioFile.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No audio file provided."));
        }

        try {
            byte[] audioBytes = audioFile.getBytes();
            String mimeType = audioFile.getContentType() != null
                    ? audioFile.getContentType()
                    : "audio/webm";

            String transcript = geminiService.transcribeAudio(audioBytes, mimeType);

            if (transcript == null || transcript.isBlank()) {
                return ResponseEntity.ok(Map.of("transcript", "", "warning", "No speech detected."));
            }

            return ResponseEntity.ok(Map.of("transcript", transcript));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Transcription failed: " + e.getMessage()));
        }
    }
}
