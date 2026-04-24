package com.kredia.entity.credit;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.kredia.entity.user.User;
import com.kredia.enums.CreditStatus;
import com.kredia.enums.RepaymentType;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "credit")
public class Credit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "credit_id")
    private Long creditId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User user;

    @JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getUserId() : null;
    }

    @JsonProperty("userId")
    public void setUserId(Long userId) {
        if (userId != null) {
            this.user = new User();
            this.user.setUserId(userId);
        }
    }

    @NotNull(message = "Le montant est obligatoire")
    @Positive(message = "Le montant doit être positif")
    @Column(name = "amount", nullable = false)
    private Float amount;

    @NotNull(message = "Le taux d'intérêt est obligatoire")
    @Positive(message = "Le taux d'intérêt doit être positif")
    @Column(name = "interest_rate", nullable = false)
    private Float interestRate;

    @NotNull(message = "La date de début est obligatoire")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "La date de fin est obligatoire")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @NotNull(message = "La durée en mois est obligatoire")
    @Positive(message = "La durée en mois doit être positive")
    @Column(name = "term_months", nullable = false)
    private Integer termMonths;

    @NotNull(message = "Le type de remboursement est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "repayment_type", nullable = false)
    private RepaymentType repaymentType = RepaymentType.MENSUALITE_CONSTANTE;

    @Column(name = "monthly_payment", precision = 15, scale = 2)
    private BigDecimal monthlyPayment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CreditStatus status = CreditStatus.PENDING;

    @NotNull(message = "Le revenu est obligatoire")
    @Positive(message = "Le revenu doit être positif")
    @Column(name = "income", nullable = false, precision = 15, scale = 2)
    private BigDecimal income;

    @NotNull(message = "Le nombre de personnes à charge est obligatoire")
    @Min(value = 0, message = "Le nombre de personnes à charge ne peut pas être négatif")
    @Column(name = "dependents", nullable = false)
    private Integer dependents;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "credit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Echeance> echeances;

    @OneToMany(mappedBy = "credit", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<KycLoan> kycLoanDocuments;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getCreditId() {
        return creditId;
    }

    public void setCreditId(Long creditId) {
        this.creditId = creditId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Float getAmount() {
        return amount;
    }

    public void setAmount(Float amount) {
        this.amount = amount;
    }

    public Float getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(Float interestRate) {
        this.interestRate = interestRate;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getTermMonths() {
        return termMonths;
    }

    public void setTermMonths(Integer termMonths) {
        this.termMonths = termMonths;
    }

    public RepaymentType getRepaymentType() {
        return repaymentType;
    }

    public void setRepaymentType(RepaymentType repaymentType) {
        this.repaymentType = repaymentType;
    }

    public BigDecimal getMonthlyPayment() {
        return monthlyPayment;
    }

    public void setMonthlyPayment(BigDecimal monthlyPayment) {
        this.monthlyPayment = monthlyPayment;
    }

    public CreditStatus getStatus() {
        return status;
    }

    public void setStatus(CreditStatus status) {
        this.status = status;
    }

    public BigDecimal getIncome() {
        return income;
    }

    public void setIncome(BigDecimal income) {
        this.income = income;
    }

    public Integer getDependents() {
        return dependents;
    }

    public void setDependents(Integer dependents) {
        this.dependents = dependents;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<Echeance> getEcheances() {
        return echeances;
    }

    public void setEcheances(List<Echeance> echeances) {
        this.echeances = echeances;
    }

    public List<KycLoan> getKycLoanDocuments() {
        return kycLoanDocuments;
    }

    public void setKycLoanDocuments(List<KycLoan> kycLoanDocuments) {
        this.kycLoanDocuments = kycLoanDocuments;
    }
}