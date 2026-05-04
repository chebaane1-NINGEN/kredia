package com.kredia.service;

import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.Echeance;
import com.kredia.entity.user.User;
import com.kredia.enums.EcheanceStatus;
import com.kredia.enums.RepaymentType;
import com.kredia.repository.CreditRepository;
import com.kredia.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CreditService {

    private static final int SCALE = 2;
    private static final int PRECISION_SCALE = 10;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_EVEN;

    private final CreditRepository creditRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Autowired
    public CreditService(CreditRepository creditRepository, UserRepository userRepository, EmailService emailService) {
        this.creditRepository = creditRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public Credit createCredit(Credit credit) {
        Long userId = credit.getUser().getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
        credit.setUser(user);

        List<Echeance> echeances;
        if (credit.getRepaymentType() == RepaymentType.MENSUALITE_CONSTANTE) {
            echeances = generateAnnuiteConstante(credit);
        } else if (credit.getRepaymentType() == RepaymentType.IN_FINE) {
            echeances = generateInFine(credit);
        } else {
            echeances = generateAmortissementConstant(credit);
        }
        LocalDate today = LocalDate.now();
        java.math.BigDecimal penaltyRate = new java.math.BigDecimal("0.05");

        for (Echeance e : echeances) {
            if (e.getDueDate().isBefore(today)) {
                e.setStatus(EcheanceStatus.OVERDUE);
                java.math.BigDecimal penalty = e.getAmountDue().multiply(penaltyRate);
                e.setAmountDue(e.getAmountDue().add(penalty).setScale(2, RoundingMode.HALF_EVEN));
                emailService.sendEcheanceOverdueEmail(user, e);
            }
        }

        credit.setEcheances(echeances);

        return creditRepository.save(credit);
    }

    private List<Echeance> generateAmortissementConstant(Credit credit) {
        BigDecimal principal = BigDecimal.valueOf(credit.getAmount());
        BigDecimal annualRate = BigDecimal.valueOf(credit.getInterestRate());
        int durationMonths = credit.getTermMonths();

        BigDecimal monthlyRate = annualRate
                .divide(BigDecimal.valueOf(100), PRECISION_SCALE, ROUNDING)
                .divide(BigDecimal.valueOf(12), PRECISION_SCALE, ROUNDING);

        BigDecimal constantPrincipal = principal.divide(
                BigDecimal.valueOf(durationMonths), SCALE, ROUNDING);

        List<Echeance> echeances = new ArrayList<>();
        BigDecimal capitalDebut = principal;
        LocalDate dueDateIterator = credit.getStartDate();

        for (int month = 1; month <= durationMonths; month++) {
            BigDecimal interestDue = capitalDebut.multiply(monthlyRate).setScale(SCALE, ROUNDING);

            BigDecimal principalDue = (month == durationMonths) ? capitalDebut : constantPrincipal;

            BigDecimal amountDue = principalDue.add(interestDue);
            BigDecimal remainingBalance = capitalDebut.subtract(principalDue)
                    .max(BigDecimal.ZERO);

            dueDateIterator = dueDateIterator.plusMonths(1);

            Echeance e = new Echeance();
            e.setCredit(credit);
            e.setEcheanceNumber(month);
            e.setCapitalDebut(capitalDebut.setScale(SCALE, ROUNDING));
            e.setDueDate(dueDateIterator);
            e.setPrincipalDue(principalDue.setScale(SCALE, ROUNDING));
            e.setInterestDue(interestDue);
            e.setAmountDue(amountDue.setScale(SCALE, ROUNDING));
            e.setRemainingBalance(remainingBalance.setScale(SCALE, ROUNDING));
            e.setAmountPaid(BigDecimal.ZERO);
            e.setStatus(EcheanceStatus.PENDING);

            echeances.add(e);
            capitalDebut = remainingBalance;
        }

        return echeances;
    }


    private List<Echeance> generateAnnuiteConstante(Credit credit) {
        BigDecimal principal = BigDecimal.valueOf(credit.getAmount());
        BigDecimal annualRate = BigDecimal.valueOf(credit.getInterestRate());
        int durationMonths = credit.getTermMonths();

        BigDecimal monthlyRate = annualRate
                .divide(BigDecimal.valueOf(100), PRECISION_SCALE, ROUNDING)
                .divide(BigDecimal.valueOf(12), PRECISION_SCALE, ROUNDING);

        BigDecimal monthlyPayment;
        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            monthlyPayment = principal.divide(BigDecimal.valueOf(durationMonths), SCALE, ROUNDING);
        } else {
            BigDecimal onePlusRate = BigDecimal.ONE.add(monthlyRate);
            BigDecimal power = onePlusRate.pow(durationMonths);
            BigDecimal inversePower = BigDecimal.ONE.divide(power, PRECISION_SCALE, ROUNDING);
            BigDecimal denominator = BigDecimal.ONE.subtract(inversePower);
            monthlyPayment = principal
                    .multiply(monthlyRate)
                    .divide(denominator, SCALE, ROUNDING);
        }

        credit.setMonthlyPayment(monthlyPayment);

        List<Echeance> echeances = new ArrayList<>();
        BigDecimal capitalDebut = principal;
        LocalDate dueDateIterator = credit.getStartDate();

        for (int month = 1; month <= durationMonths; month++) {
            BigDecimal interestDue = capitalDebut.multiply(monthlyRate).setScale(SCALE, ROUNDING);

            BigDecimal principalDue;
            BigDecimal actualMonthlyPayment;
            if (month == durationMonths) {
                principalDue = capitalDebut;
                actualMonthlyPayment = principalDue.add(interestDue);
            } else {
                principalDue = monthlyPayment.subtract(interestDue);
                actualMonthlyPayment = monthlyPayment;
            }

            BigDecimal remainingBalance = capitalDebut.subtract(principalDue).max(BigDecimal.ZERO);

            dueDateIterator = dueDateIterator.plusMonths(1);

            Echeance e = new Echeance();
            e.setCredit(credit);
            e.setEcheanceNumber(month);
            e.setCapitalDebut(capitalDebut.setScale(SCALE, ROUNDING));
            e.setDueDate(dueDateIterator);
            e.setPrincipalDue(principalDue.setScale(SCALE, ROUNDING));
            e.setInterestDue(interestDue);
            e.setAmountDue(actualMonthlyPayment.setScale(SCALE, ROUNDING));
            e.setRemainingBalance(remainingBalance.setScale(SCALE, ROUNDING));
            e.setAmountPaid(BigDecimal.ZERO);
            e.setStatus(EcheanceStatus.PENDING);

            echeances.add(e);
            capitalDebut = remainingBalance;
        }

        return echeances;
    }


    private List<Echeance> generateInFine(Credit credit) {
        BigDecimal principal = BigDecimal.valueOf(credit.getAmount());
        BigDecimal annualRate = BigDecimal.valueOf(credit.getInterestRate());
        int durationMonths = credit.getTermMonths();

        BigDecimal monthlyRate = annualRate
                .divide(BigDecimal.valueOf(100), PRECISION_SCALE, ROUNDING)
                .divide(BigDecimal.valueOf(12), PRECISION_SCALE, ROUNDING);

        BigDecimal monthlyInterest = principal.multiply(monthlyRate).setScale(SCALE, ROUNDING);

        List<Echeance> echeances = new ArrayList<>();
        LocalDate dueDateIterator = credit.getStartDate();

        for (int month = 1; month <= durationMonths; month++) {
            boolean isLastMonth = (month == durationMonths);

            BigDecimal principalDue = isLastMonth ? principal : BigDecimal.ZERO;
            BigDecimal interestDue = monthlyInterest;
            BigDecimal amountDue = principalDue.add(interestDue);
            BigDecimal remainingBalance = isLastMonth ? BigDecimal.ZERO : principal;

            dueDateIterator = dueDateIterator.plusMonths(1);

            Echeance e = new Echeance();
            e.setCredit(credit);
            e.setEcheanceNumber(month);
            e.setCapitalDebut(principal.setScale(SCALE, ROUNDING));
            e.setDueDate(dueDateIterator);
            e.setPrincipalDue(principalDue.setScale(SCALE, ROUNDING));
            e.setInterestDue(interestDue);
            e.setAmountDue(amountDue.setScale(SCALE, ROUNDING));
            e.setRemainingBalance(remainingBalance.setScale(SCALE, ROUNDING));
            e.setAmountPaid(BigDecimal.ZERO);
            e.setStatus(EcheanceStatus.PENDING);

            echeances.add(e);
        }

        return echeances;
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
            credit.setRepaymentType(creditDetails.getRepaymentType());
            return creditRepository.save(credit);
        }).orElseThrow(() -> new RuntimeException("Credit not found with id " + id));
    }

    public void deleteCredit(Long id) {
        creditRepository.deleteById(id);
    }
}
