package com.kredia.controller.agent;

import com.kredia.dto.ApiResponse;
import com.kredia.dto.user.EnhancedAgentPerformanceDTO;
import com.kredia.service.user.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agent")
public class AgentPerformanceController {

    private final UserService userService;

    public AgentPerformanceController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/performance/{agentId}")
    public ResponseEntity<ApiResponse<EnhancedAgentPerformanceDTO>> getAgentPerformance(@PathVariable("agentId") Long agentId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.agentPerformanceEnhanced(agentId)));
    }
}
