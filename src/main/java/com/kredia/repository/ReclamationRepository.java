package com.kredia.repository;

import com.kredia.entity.support.Reclamation;
import com.kredia.enums.ReclamationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {

    Page<Reclamation> findByUserId(Long userId, Pageable pageable);

    Page<Reclamation> findByStatus(ReclamationStatus status, Pageable pageable);

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);

    List<Reclamation> findByStatusAndLastActivityAtBefore(ReclamationStatus status, LocalDateTime before);
}
