package com.kredia.service;

import com.kredia.entity.credit.Credit;
import com.kredia.entity.credit.Echeance;
import com.kredia.entity.User;
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

    @Autowired
    public CreditService(CreditRepository creditRepository, UserRepository userRepository) {
        this.creditRepository = creditRepository;
        this.userRepository = userRepository;
    }

    public Credit createCredit(Credit credit) {
        // 1. Validate and fetch full User entity
        Long userId = credit.getUser().getId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
        credit.setUser(user);

        // 2. Dispatch selon le type de remboursement
        List<Echeance> echeances;
        if (credit.getRepaymentType() == RepaymentType.MENSUALITE_CONSTANTE) {
            echeances = generateAnnuiteConstante(credit);
        } else if (credit.getRepaymentType() == RepaymentType.IN_FINE) {
            echeances = generateInFine(credit);
        } else {
            echeances = generateAmortissementConstant(credit);
        }
        credit.setEcheances(echeances);

        // 3. Save credit with all echeances in one transaction
        return creditRepository.save(credit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MÉTHODE 1 : AMORTISSEMENT CONSTANT
    // - principal_due = C / n → CONSTANT
    // - interest_due = capital_debut × i → DÉCROISSANT
    // - amount_due = principal_due + interest_due → DÉCROISSANTE
    // - remaining = capital_debut − principal_due → DÉCROISSANT
    // ─────────────────────────────────────────────────────────────────────────
    private List<Echeance> generateAmortissementConstant(Credit credit) {
        BigDecimal principal = BigDecimal.valueOf(credit.getAmount());
        BigDecimal annualRate = BigDecimal.valueOf(credit.getInterestRate());
        int durationMonths = credit.getTermMonths();

        // i = taux_annuel / 12 / 100
        BigDecimal monthlyRate = annualRate
                .divide(BigDecimal.valueOf(100), PRECISION_SCALE, ROUNDING)
                .divide(BigDecimal.valueOf(12), PRECISION_SCALE, ROUNDING);

        // Amortissement fixe : C / n
        BigDecimal constantPrincipal = principal.divide(
                BigDecimal.valueOf(durationMonths), SCALE, ROUNDING);

        List<Echeance> echeances = new ArrayList<>();
        BigDecimal capitalDebut = principal;
        LocalDate dueDateIterator = credit.getStartDate();

        for (int month = 1; month <= durationMonths; month++) {
            BigDecimal interestDue = capitalDebut.multiply(monthlyRate).setScale(SCALE, ROUNDING);

            // Dernier mois : exact pour éviter les arrondis
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

    // ─────────────────────────────────────────────────────────────────────────
    // MÉTHODE 2 : ANNUITÉ CONSTANTE (Mensualité Constante)
    //
    // Formule mensualité :
    // M = E × i / (1 - (1 + i)^-n)
    // Avec :
    // i = taux_annuel / 12 / 100 (taux mensuel)
    // n = durée en mois
    //
    // Chaque mois :
    // (1) interest_due = capital_debut × i → DÉCROISSANT
    // (2) principal_due = M - interest_due → CROISSANT
    // (3) capital_debut(m+1) = capital_debut(m) - principal_due
    // ─────────────────────────────────────────────────────────────────────────
    private List<Echeance> generateAnnuiteConstante(Credit credit) {
        BigDecimal principal = BigDecimal.valueOf(credit.getAmount());
        BigDecimal annualRate = BigDecimal.valueOf(credit.getInterestRate());
        int durationMonths = credit.getTermMonths();

        // i = taux_annuel / 12 / 100
        BigDecimal monthlyRate = annualRate
                .divide(BigDecimal.valueOf(100), PRECISION_SCALE, ROUNDING)
                .divide(BigDecimal.valueOf(12), PRECISION_SCALE, ROUNDING);

        // M = E × i / (1 − (1 + i)^−n)
        BigDecimal monthlyPayment;
        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            // Cas taux = 0 : mensualité = capital / n
            monthlyPayment = principal.divide(BigDecimal.valueOf(durationMonths), SCALE, ROUNDING);
        } else {
            BigDecimal onePlusRate = BigDecimal.ONE.add(monthlyRate);
            // (1 + i)^n calculé avec précision
            BigDecimal power = onePlusRate.pow(durationMonths);
            // (1 + i)^-n = 1 / (1 + i)^n
            BigDecimal inversePower = BigDecimal.ONE.divide(power, PRECISION_SCALE, ROUNDING);
            // dénominateur = 1 - (1 + i)^-n
            BigDecimal denominator = BigDecimal.ONE.subtract(inversePower);
            // M = E × i / dénominateur
            monthlyPayment = principal
                    .multiply(monthlyRate)
                    .divide(denominator, SCALE, ROUNDING);
        }

        // Stocker la mensualité fixe dans le crédit
        credit.setMonthlyPayment(monthlyPayment);

        List<Echeance> echeances = new ArrayList<>();
        BigDecimal capitalDebut = principal;
        LocalDate dueDateIterator = credit.getStartDate();

        for (int month = 1; month <= durationMonths; month++) {
            // (1) Intérêt = capital_debut × i
            BigDecimal interestDue = capitalDebut.multiply(monthlyRate).setScale(SCALE, ROUNDING);

            // (2) Amortissement = M - Intérêt (dernier mois = capital restant exact)
            BigDecimal principalDue;
            BigDecimal actualMonthlyPayment;
            if (month == durationMonths) {
                principalDue = capitalDebut;
                actualMonthlyPayment = principalDue.add(interestDue);
            } else {
                principalDue = monthlyPayment.subtract(interestDue);
                actualMonthlyPayment = monthlyPayment;
            }

            // (3) Capital restant = capital_debut - amortissement
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

    // ─────────────────────────────────────────────────────────────────────────
    // MÉTHODE 3 : IN FINE
    //
    // Principe :
    // - Chaque mois : on paie UNIQUEMENT l'intérêt
    // - Dernier mois : on rembourse le capital ENTIER + dernier intérêt
    //
    // Formule :
    // interest_due = capital_debut × i (constant car capital ne bouge pas)
    // principal_due = 0 (sauf dernier mois = capital total)
    // amount_due = interest_due (sauf dernier mois = capital + intérêt)
    // remaining_balance = capital (inchangé jusqu'au dernier mois)
    // ─────────────────────────────────────────────────────────────────────────
    private List<Echeance> generateInFine(Credit credit) {
        BigDecimal principal = BigDecimal.valueOf(credit.getAmount());
        BigDecimal annualRate = BigDecimal.valueOf(credit.getInterestRate());
        int durationMonths = credit.getTermMonths();

        // i = taux_annuel / 12 / 100
        BigDecimal monthlyRate = annualRate
                .divide(BigDecimal.valueOf(100), PRECISION_SCALE, ROUNDING)
                .divide(BigDecimal.valueOf(12), PRECISION_SCALE, ROUNDING);

        // Intérêt mensuel constant = E × i (capital ne diminue pas)
        BigDecimal monthlyInterest = principal.multiply(monthlyRate).setScale(SCALE, ROUNDING);

        List<Echeance> echeances = new ArrayList<>();
        LocalDate dueDateIterator = credit.getStartDate();

        for (int month = 1; month <= durationMonths; month++) {
            boolean isLastMonth = (month == durationMonths);

            // Dernier mois : on rembourse tout le capital + intérêt
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
