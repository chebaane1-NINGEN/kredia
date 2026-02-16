package com.kredia.user.controller;

import com.kredia.user.dto.UserProfileDTO;
import com.kredia.user.dto.UserResponseDTO;
import com.kredia.user.entity.User;
import com.kredia.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> registerUser(@Valid @RequestBody User user) {
        User savedUser = userService.registerUser(user);
        return ResponseEntity.ok(userService.getUserProfile(savedUser.getUserId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.getUserProfile(user.getUserId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponseDTO> updateProfile(@AuthenticationPrincipal User user,
            @RequestBody UserProfileDTO dto) {
        return ResponseEntity.ok(userService.updateProfile(user.getUserId(), dto));
    }
}
