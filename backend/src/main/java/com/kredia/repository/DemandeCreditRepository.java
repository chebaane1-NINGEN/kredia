package com.kredia.repository;

import com.kredia.entity.credit.DemandeCredit;
import com.kredia.enums.CreditStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeCreditRepository extends JpaRepository<DemandeCredit, Long> {
    List<DemandeCredit> findByStatus(CreditStatus status);
    List<DemandeCredit> findByUser_Id(Long userId);
}
