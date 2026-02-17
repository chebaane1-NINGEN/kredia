package com.kredia.controller;

import com.kredia.dto.notification.*;
import com.kredia.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 1) Create notification (for now manual; later auto-trigger)
    @PostMapping
    public NotificationResponse create(@Valid @RequestBody NotificationCreateRequest request) {
        return notificationService.create(request);
    }

    // 2) Get notifications by user (optional isRead filter)
    @GetMapping("/by-user/{userId}")
    public Page<NotificationResponse> getByUser(@PathVariable Long userId,
                                                @RequestParam(required = false) Boolean isRead,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        return notificationService.getByUser(userId, isRead, page, size);
    }

    // 3) Mark as read
    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(@PathVariable Long id) {
        return notificationService.markAsRead(id);
    }

    // 4) Delete
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        notificationService.delete(id);
    }
}
