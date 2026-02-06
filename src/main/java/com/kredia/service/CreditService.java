package com.kredia.service;

import com.kredia.entity.credit.Credit;
import com.kredia.repository.CreditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CreditService {

    private final CreditRepository creditRepository;

    @Autowired
    public CreditService(CreditRepository creditRepository) {
        this.creditRepository = creditRepository;
    }

    public Credit createCredit(Credit credit) {
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
            // Don't update protected fields like createdAt or user if not intended
            return creditRepository.save(credit);
        }).orElseThrow(() -> new RuntimeException("Credit not found with id " + id));
    }

    public void deleteCredit(Long id) {
        creditRepository.deleteById(id);
    }
}
