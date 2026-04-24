package com.kredia.repository;

import com.kredia.entity.credit.KycLoan;
import com.kredia.enums.DocumentTypeLoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycLoanRepository extends JpaRepository<KycLoan, Long> {
    
    List<KycLoan> findByCreditCreditId(Long creditId);

    List<KycLoan> findByUser_Id(Long userId);

    List<KycLoan> findByDemande_Id(Long demandeId);

    List<KycLoan> findByUser_IdAndCreditIsNull(Long userId);
}
