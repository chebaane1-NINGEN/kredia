package com.kredia.repository;

import com.kredia.entity.support.ReclamationHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReclamationHistoryRepository extends JpaRepository<ReclamationHistory, Long> {
    List<ReclamationHistory> findByReclamation_ReclamationIdOrderByChangedAtDesc(Long reclamationId);
}
