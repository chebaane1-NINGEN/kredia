package com.kredia.repository;

import com.kredia.entity.support.ReclamationAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReclamationAttachmentRepository extends JpaRepository<ReclamationAttachment, Long> {

    List<ReclamationAttachment> findByReclamation_ReclamationIdOrderByUploadedAtDesc(Long reclamationId);
}
