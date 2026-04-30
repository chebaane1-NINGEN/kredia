package com.kredia.controller.support;

import com.kredia.dto.ApiResponse;
import com.kredia.entity.support.DirectMessage;
import com.kredia.repository.support.DirectMessageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final DirectMessageRepository repository;

    public MessageController(DirectMessageRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<List<DirectMessage>>> getConversation(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable Long userId
    ) {
        repository.markConversationRead(actorId, userId);
        return ResponseEntity.ok(ApiResponse.ok(repository.findConversation(actorId, userId)));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<DirectMessage>>> getUnread(
            @RequestHeader("X-Actor-Id") Long actorId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(repository.findUnreadForReceiver(actorId)));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @RequestHeader("X-Actor-Id") Long actorId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(repository.countByReceiverIdAndReadFalse(actorId)));
    }

    @PatchMapping("/{userId}/read")
    public ResponseEntity<ApiResponse<Integer>> markConversationRead(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(repository.markConversationRead(actorId, userId)));
    }

    @PostMapping("/{userId}")
    public ResponseEntity<ApiResponse<DirectMessage>> sendMessage(
            @RequestHeader("X-Actor-Id") Long actorId,
            @PathVariable Long userId,
            @RequestBody String content
    ) {
        DirectMessage dm = DirectMessage.builder()
                .senderId(actorId)
                .receiverId(userId)
                .content(content)
                .read(false)
                .build();
        return ResponseEntity.ok(ApiResponse.ok(repository.save(dm)));
    }
}
