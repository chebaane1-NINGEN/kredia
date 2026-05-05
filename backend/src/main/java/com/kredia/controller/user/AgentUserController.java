package com.kredia.controller.user;

import com.kredia.dto.ApiResponse;
import com.kredia.dto.user.AgentDashboard;
import com.kredia.dto.user.EnhancedClientDTO;
import com.kredia.dto.user.UserActivityResponseDTO;
import com.kredia.entity.user.UserActivityActionType;
import com.kredia.entity.user.UserStatus;
import com.kredia.service.user.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/user/agent")
public class AgentUserController {

    private final UserService userService;

    public AgentUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{agentId}/dashboard")
    public ResponseEntity<ApiResponse<AgentDashboard>> getDashboard(@PathVariable("agentId") Long agentId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.agentDashboard(agentId)));
    }

    @GetMapping("/{agentId}/activity")
    public ResponseEntity<ApiResponse<Page<UserActivityResponseDTO>>> getActivity(
            @PathVariable("agentId") Long agentId,
            @RequestParam(name = "actionType", required = false) List<UserActivityActionType> actionTypes,
            @RequestParam(name = "clientId", required = false) Long clientId,
            @RequestParam(name = "from", required = false) String from,
            @RequestParam(name = "to", required = false) String to,
            @RequestParam(name = "searchTerm", required = false) String searchTerm,
            @PageableDefault Pageable pageable
    ) {
        try {
            Instant fromInstant = from != null ? Instant.parse(from) : null;
            Instant toInstant = to != null ? Instant.parse(to) : null;
            return ResponseEntity.ok(ApiResponse.ok(userService.agentActivityEnhanced(agentId, actionTypes, clientId, fromInstant, toInstant, searchTerm, pageable)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Failed to fetch activity: " + e.getMessage()));
        }
    }

    @GetMapping("/clients/enhanced")
    public ResponseEntity<ApiResponse<Page<EnhancedClientDTO>>> getClientsEnhanced(
            @RequestHeader("X-Actor-Id") Long actorId,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "statuses", required = false) List<UserStatus> statuses,
            @RequestParam(name = "priorities", required = false) List<String> priorities,
            @RequestParam(name = "startDate", required = false) String startDate,
            @RequestParam(name = "endDate", required = false) String endDate,
            @PageableDefault Pageable pageable
    ) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(userService.agentClientsEnhanced(actorId, Optional.ofNullable(email), Optional.ofNullable(statuses), Optional.ofNullable(priorities), parseStartOfDay(startDate), parseEndOfDay(endDate), pageable)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Failed to fetch enhanced clients: " + e.getMessage()));
        }
    }

    private Optional<Instant> parseStartOfDay(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            if (value.contains("T")) {
                return Optional.of(Instant.parse(value));
            }
            // Assume date format, convert to start of day
            return Optional.of(Instant.parse(value + "T00:00:00Z"));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private Optional<Instant> parseEndOfDay(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            if (value.contains("T")) {
                return Optional.of(Instant.parse(value));
            }
            // Assume date format, convert to end of day
            return Optional.of(Instant.parse(value + "T23:59:59Z"));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}