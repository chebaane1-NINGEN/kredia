package com.kredia.repository;

import com.kredia.entity.credit.Credit;
import com.kredia.enums.CreditStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface CreditRepository extends JpaRepository<Credit, Long> {

    boolean existsByUser_IdAndStatusIn(Long userId, Collection<CreditStatus> statuses);
}
