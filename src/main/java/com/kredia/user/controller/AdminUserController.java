package com.kredia.user.controller;

import com.kredia.common.Role;
import com.kredia.user.dto.UserResponseDTO;
import com.kredia.user.entity.User;
import com.kredia.user.repository.UserRepository;
import com.kredia.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<UserResponseDTO> users = userRepository.findAll().stream()
                .map(u -> userService.getUserProfile(u.getUserId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<UserResponseDTO> createEmployee(@RequestBody User user) {
        // Only allow creating AGENT or AUDITOR accounts
        if (user.getRole() != Role.AGENT && user.getRole() != Role.AUDITOR) {
            return ResponseEntity.badRequest().build();
        }
        User created = userService.createUser(user);
        return ResponseEntity.ok(userService.getUserProfile(created.getUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
