package com.kredia.repository.support;

import com.kredia.entity.support.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {

    @Query("SELECT dm FROM DirectMessage dm WHERE (dm.senderId = :u1 AND dm.receiverId = :u2) OR (dm.senderId = :u2 AND dm.receiverId = :u1) ORDER BY dm.createdAt ASC")
    List<DirectMessage> findConversation(Long u1, Long u2);

    List<DirectMessage> findByReceiverIdAndReadFalse(Long receiverId);
}
