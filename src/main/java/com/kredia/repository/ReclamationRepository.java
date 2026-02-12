package com.kredia.repository;

import com.kredia.entity.support.Reclamation;
import com.kredia.enums.ReclamationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {

    Page<Reclamation> findByUserId(Long userId, Pageable pageable);

    Page<Reclamation> findByStatus(ReclamationStatus status, Pageable pageable);

    long countByUserIdAndCreatedAtAfter(Long userId, java.time.LocalDateTime after);
}
