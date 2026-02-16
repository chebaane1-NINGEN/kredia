package com.kredia.dashboard.controller;

import com.kredia.dashboard.dto.FintechAnalyticsDTO;
import com.kredia.dashboard.service.FintechAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard/fintech")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FintechAnalyticsController {

    private final FintechAnalyticsService fintechAnalyticsService;

    @GetMapping("/stats")
    public ResponseEntity<FintechAnalyticsDTO> getFintechStats() {
        return ResponseEntity.ok(fintechAnalyticsService.getFullFintechAnalytics());
    }
}
