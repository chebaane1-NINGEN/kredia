package com.kredia.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired
    private DataSource dataSource;

    @GetMapping
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        
        health.put("status", "UP");
        health.put("application", "Kredia API");
        health.put("timestamp", java.time.LocalDateTime.now());
        
        // Test de connexion à la base de données
        try (Connection conn = dataSource.getConnection()) {
            health.put("database", "Connected");
            health.put("databaseProduct", conn.getMetaData().getDatabaseProductName());
            health.put("databaseVersion", conn.getMetaData().getDatabaseProductVersion());
        } catch (Exception e) {
            health.put("database", "Disconnected");
            health.put("error", e.getMessage());
            return ResponseEntity.status(503).body(health);
        }
        
        return ResponseEntity.ok(health);
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }
}
