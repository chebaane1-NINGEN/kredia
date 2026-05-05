package com.kredia.controller.user;

import com.kredia.dto.ApiResponse;
import com.kredia.dto.user.UserResponseDTO;
import com.kredia.service.user.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/admin")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/agents")
    public ResponseEntity<ApiResponse<Page<UserResponseDTO>>> getAgents(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PageableDefault Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userService.adminAgent(actorId, pageable)));
    }
}