package com.kredia.repository.user;

import com.kredia.entity.user.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findBySenderIdOrReceiverIdOrderByTimestampDesc(Long senderId, Long receiverId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE (m.senderId = :userId OR m.receiverId = :userId) ORDER BY m.timestamp DESC")
    Page<Message> findConversationByUserId(Long userId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE ((m.senderId = :userId1 AND m.receiverId = :userId2) OR (m.senderId = :userId2 AND m.receiverId = :userId1)) ORDER BY m.timestamp ASC")
    List<Message> findConversationBetweenUsers(Long userId1, Long userId2);

    long countByReceiverIdAndIsReadFalse(Long receiverId);

    @Query("SELECT DISTINCT CASE WHEN m.senderId = :userId THEN m.receiverId ELSE m.senderId END FROM Message m WHERE m.senderId = :userId OR m.receiverId = :userId")
    List<Long> findUniqueConversationPartners(Long userId);
}