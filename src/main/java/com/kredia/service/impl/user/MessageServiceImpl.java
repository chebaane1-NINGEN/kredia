package com.kredia.service.impl.user;

import com.kredia.dto.user.MessageDTO;
import com.kredia.entity.user.Message;
import com.kredia.entity.user.User;
import com.kredia.entity.user.UserRole;
import com.kredia.exception.ResourceNotFoundException;
import com.kredia.repository.user.MessageRepository;
import com.kredia.repository.user.UserRepository;
import com.kredia.service.user.MessageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageServiceImpl(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public MessageDTO sendMessage(Long senderId, Long receiverId, String content) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        // Validate roles: only ADMIN and AGENT can send messages
        if (sender.getRole() != UserRole.ADMIN && sender.getRole() != UserRole.AGENT) {
            throw new IllegalArgumentException("Only admins and agents can send messages");
        }
        if (receiver.getRole() != UserRole.ADMIN && receiver.getRole() != UserRole.AGENT) {
            throw new IllegalArgumentException("Messages can only be sent to admins and agents");
        }

        Message message = new Message();
        message.setSenderId(senderId);
        message.setReceiverId(receiverId);
        message.setContent(content.trim());
        message.setRead(false);

        Message saved = messageRepository.save(message);
        return mapToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageDTO> getConversation(Long userId, Long otherUserId, Pageable pageable) {
        List<Message> messages = messageRepository.findConversationBetweenUsers(userId, otherUserId);
        List<MessageDTO> dtos = messages.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        // Convert to Page manually for simplicity
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dtos.size());
        List<MessageDTO> pageContent = dtos.subList(start, end);

        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, dtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageDTO> getAllMessages(Long userId, Pageable pageable) {
        return messageRepository.findConversationByUserId(userId, pageable)
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDTO> getRecentConversations(Long userId) {
        List<Long> partnerIds = messageRepository.findUniqueConversationPartners(userId);
        return partnerIds.stream()
                .limit(10)
                .map(partnerId -> {
                    List<Message> conversation = messageRepository.findConversationBetweenUsers(userId, partnerId);
                    if (!conversation.isEmpty()) {
                        Message latest = conversation.get(conversation.size() - 1);
                        return mapToDTO(latest);
                    }
                    return null;
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return messageRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long userId, Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getReceiverId().equals(userId)) {
            throw new IllegalArgumentException("Can only mark own messages as read");
        }

        message.setRead(true);
        messageRepository.save(message);
    }

    private MessageDTO mapToDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setSenderId(message.getSenderId());
        dto.setReceiverId(message.getReceiverId());
        dto.setContent(message.getContent());
        dto.setTimestamp(message.getTimestamp());
        dto.setRead(message.isRead());

        // Add user names
        try {
            User sender = userRepository.findById(message.getSenderId()).orElse(null);
            if (sender != null) {
                dto.setSenderName(sender.getFirstName() + " " + sender.getLastName());
            }

            User receiver = userRepository.findById(message.getReceiverId()).orElse(null);
            if (receiver != null) {
                dto.setReceiverName(receiver.getFirstName() + " " + receiver.getLastName());
            }
        } catch (Exception e) {
            // Ignore
        }

        return dto;
    }
}