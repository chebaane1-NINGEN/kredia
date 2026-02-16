package com.kredia.kyc.repository;

import com.kredia.enums.KycStatus;
import com.kredia.kyc.entity.KycDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KycRepository extends JpaRepository<KycDocument, Long> {
    List<KycDocument> findByUserUserId(Long userId);
    List<KycDocument> findByStatus(KycStatus status);
}
