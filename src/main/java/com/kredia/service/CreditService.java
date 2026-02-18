package com.kredia.service;

import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.Echeance;
import com.kredia.entity.user.User;
import com.kredia.enums.CreditStatus;
import com.kredia.enums.EcheanceStatus;
import com.kredia.repository.CreditRepository;
import com.kredia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CreditService {

    private final CreditRepository creditRepository;
    private final UserRepository userRepository;

    @Autowired
    public CreditService(CreditRepository creditRepository, UserRepository userRepository) {
        this.creditRepository = creditRepository;
        this.userRepository = userRepository;
    }

    public Credit createCredit(Credit credit) {
        // 1. Validate and fetch full User entity
        Long userId = credit.getUser().getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
        credit.setUser(user);

        // 2. Calculate monthly payment (simple interest formula)
        BigDecimal principal = BigDecimal.valueOf(credit.getAmount());
        BigDecimal rate = BigDecimal.valueOf(credit.getInterestRate());
        BigDecimal term = BigDecimal.valueOf(credit.getTermMonths());

        BigDecimal totalInterest = principal.multiply(rate)
                .divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);
        BigDecimal totalAmount = principal.add(totalInterest);
        BigDecimal monthlyAmount = totalAmount.divide(term, 2, BigDecimal.ROUND_HALF_UP);

        // 3. Generate Echeance records
        List<Echeance> echeances = new ArrayList<>();
        LocalDate dueDateIterator = credit.getStartDate();

        for (int i = 0; i < credit.getTermMonths(); i++) {
            Echeance echeance = new Echeance();
            echeance.setCredit(credit);
            echeance.setAmountDue(monthlyAmount);
            echeance.setAmountPaid(BigDecimal.ZERO);
            echeance.setStatus(EcheanceStatus.PENDING);

            dueDateIterator = dueDateIterator.plusMonths(1);
            echeance.setDueDate(dueDateIterator);

            echeances.add(echeance);
        }

        credit.setEcheances(echeances);

        // 4. Save credit with all echeances in one transaction
        return creditRepository.save(credit);
    }

    public Optional<Credit> getCreditById(Long id) {
        return creditRepository.findById(id);
    }

    public List<Credit> getAllCredits() {
        return creditRepository.findAll();
    }

    public Credit updateCredit(Long id, Credit creditDetails) {
        return creditRepository.findById(id).map(credit -> {
            credit.setAmount(creditDetails.getAmount());
            credit.setInterestRate(creditDetails.getInterestRate());
            credit.setStartDate(creditDetails.getStartDate());
            credit.setEndDate(creditDetails.getEndDate());
            credit.setTermMonths(creditDetails.getTermMonths());
            credit.setStatus(creditDetails.getStatus());
            credit.setIncome(creditDetails.getIncome());
            credit.setDependents(creditDetails.getDependents());
            return creditRepository.save(credit);
        }).orElseThrow(() -> new RuntimeException("Credit not found with id " + id));
    }

    public void deleteCredit(Long id) {
        creditRepository.deleteById(id);
    }
}
