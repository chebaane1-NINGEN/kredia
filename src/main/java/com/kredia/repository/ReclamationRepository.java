package com.kredia.repository;

import com.kredia.entity.support.Reclamation;
import com.kredia.enums.ReclamationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReclamationRepository extends JpaRepository<Reclamation, Long> {

    Page<Reclamation> findByUserId(Long userId, Pageable pageable);

    Page<Reclamation> findByStatus(ReclamationStatus status, Pageable pageable);

    long countByUserId(Long userId);

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);

    @Query(value = """
            SELECT COUNT(*)
            FROM reclamation r
            WHERE r.user_id = :userId
              AND (
                  LOWER(TRIM(r.subject)) = LOWER(TRIM(:subject))
                  OR LOWER(TRIM(r.description)) = LOWER(TRIM(:description))
              )
            """, nativeQuery = true)
    long countDuplicateCandidates(
            @Param("userId") Long userId,
            @Param("subject") String subject,
            @Param("description") String description
    );

    List<Reclamation> findByStatusAndLastActivityAtBefore(ReclamationStatus status, LocalDateTime before);
}
