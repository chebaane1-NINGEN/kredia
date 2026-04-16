package com.kredia.service.user;

import com.kredia.dto.user.MessageDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MessageService {

    MessageDTO sendMessage(Long senderId, Long receiverId, String content);

    Page<MessageDTO> getConversation(Long userId, Long otherUserId, Pageable pageable);

    Page<MessageDTO> getAllMessages(Long userId, Pageable pageable);

    List<MessageDTO> getRecentConversations(Long userId);

    long getUnreadCount(Long userId);

    void markAsRead(Long userId, Long messageId);
}