package com.kredia.repository.user;

import com.kredia.entity.user.KycDocument;
import com.kredia.enums.KycStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {
    List<KycDocument> findByUserId(Long userId);
    boolean existsByUserIdAndStatus(Long userId, KycStatus status);
}
