package com.kredia.repository;

import com.kredia.entity.support.ReclamationMessage;
import com.kredia.enums.ReclamationMessageVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReclamationMessageRepository extends JpaRepository<ReclamationMessage, Long> {

    List<ReclamationMessage> findByReclamation_ReclamationIdOrderByCreatedAtAsc(Long reclamationId);

    List<ReclamationMessage> findByReclamation_ReclamationIdAndVisibilityOrderByCreatedAtAsc(
            Long reclamationId,
            ReclamationMessageVisibility visibility
    );
}
