package com.kredia.repository;

import com.kredia.entity.credit.KycLoan;
import com.kredia.enums.DocumentTypeLoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycLoanRepository extends JpaRepository<KycLoan, Long> {

    List<KycLoan> findByCreditCreditId(Long creditId);

    Optional<KycLoan> findByCreditCreditIdAndDocumentType(Long creditId, DocumentTypeLoan documentType);

    @Query("SELECT k FROM KycLoan k WHERE k.user.id = :userId")
    List<KycLoan> findByUserUserId(@Param("userId") Long userId);
}
