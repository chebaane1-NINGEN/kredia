package com.kredia.dashboard.controller;

import com.kredia.dashboard.dto.AdminDashboardStatsDTO;
import com.kredia.dashboard.dto.ClientDashboardStatsDTO;
import com.kredia.dashboard.dto.EmployeeDashboardStatsDTO;
import com.kredia.dashboard.service.DashboardService;
import com.kredia.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for role-based dashboard statistics.
 * <p>
 * Each endpoint extracts the userId from the JWT security context
 * (via {@code @AuthenticationPrincipal}) — no request parameters
 * for userId are accepted, preventing privilege escalation.
 * </p>
 *
 * <ul>
 * <li>{@code GET /api/dashboard/client} — CLIENT only</li>
 * <li>{@code GET /api/dashboard/employee} — AGENT / AUDITOR only</li>
 * <li>{@code GET /api/dashboard/admin} — ADMIN only</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Client dashboard: personal loan statistics.
     * Restricted to users with ROLE_CLIENT.
     */
    @GetMapping("/client")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ClientDashboardStatsDTO> getClientDashboard(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.getClientStats(user.getUserId()));
    }

    /**
     * Employee dashboard: handled credit statistics.
     * Restricted to users with ROLE_AGENT or ROLE_AUDITOR.
     */
    @GetMapping("/employee")
    @PreAuthorize("hasAnyRole('AGENT', 'AUDITOR')")
    public ResponseEntity<EmployeeDashboardStatsDTO> getEmployeeDashboard(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.getEmployeeStats(user.getUserId()));
    }

    /**
     * Admin dashboard: platform-wide statistics.
     * Restricted to users with ROLE_ADMIN.
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardStatsDTO> getAdminDashboard(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dashboardService.getAdminStats());
    }
}
