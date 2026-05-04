package com.kredia.controller;

import com.kredia.entity.user.User;
import com.kredia.repository.UserRepository;
import com.kredia.util.HashUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"})
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request == null || isBlank(request.email()) || isBlank(request.password())) {
            return unauthorized();
        }

        return userRepository.findByEmail(request.email().trim())
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .filter(user -> passwordMatches(request.password(), user.getPasswordHash()))
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(successResponse(user)))
                .orElseGet(this::unauthorized);
    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        if (storedPassword == null) {
            return false;
        }
        return storedPassword.equals(rawPassword)
                || storedPassword.equals(HashUtil.calculateHash(rawPassword));
    }

    private Map<String, Object> successResponse(User user) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("token", createToken(user));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("data", data);
        response.put("timestamp", Instant.now().toString());
        return response;
    }

    private String createToken(User user) {
        Instant now = Instant.now();
        String role = user.getRole() == null ? "CLIENT" : user.getRole().name().toUpperCase();

        String header = "{\"alg\":\"none\",\"typ\":\"JWT\"}";
        String payload = "{"
                + "\"sub\":\"" + user.getUserId() + "\","
                + "\"email\":\"" + escapeJson(user.getEmail()) + "\","
                + "\"role\":\"" + escapeJson(role) + "\","
                + "\"firstName\":\"" + escapeJson(user.getFirstName()) + "\","
                + "\"lastName\":\"" + escapeJson(user.getLastName()) + "\","
                + "\"iat\":" + now.getEpochSecond() + ","
                + "\"exp\":" + now.plusSeconds(86400).getEpochSecond()
                + "}";

        return base64Url(header) + "." + base64Url(payload) + ".";
    }

    private ResponseEntity<Map<String, Object>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Email ou mot de passe incorrect."));
    }

    private static String base64Url(String value) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String escapeJson(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    public record LoginRequest(String email, String password) {
    }
}
