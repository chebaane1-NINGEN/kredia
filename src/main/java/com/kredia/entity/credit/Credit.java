package com.kredia.entity.credit;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.kredia.user.entity.User;
import com.kredia.enums.CreditStatus;
import com.kredia.enums.RiskLevel;
import jakarta.persistence.*;

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

    @Column(name = "amount", nullable = false)
    private float amount;

    @Column(name = "interest_rate", nullable = false)
    private float interestRate;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "term_months", nullable = false)
    private Integer termMonths;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CreditStatus status = CreditStatus.PENDING;

    @Column(name = "income", nullable = false, precision = 15, scale = 2)
    private BigDecimal income;

    @Column(name = "dependents", nullable = false)
    private Integer dependents;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level")
    private RiskLevel riskLevel;

    @Column(name = "decision_date")
    private LocalDateTime decisionDate;

    @Column(name = "handled_by")
    private Long handledBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "credit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Echeance> echeances;

    @OneToMany(mappedBy = "credit", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<KycLoan> kycLoanDocuments;

    public Credit() {}

    public Long getCreditId() { return creditId; }
    public void setCreditId(Long creditId) { this.creditId = creditId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public float getAmount() { return amount; }
    public void setAmount(float amount) { this.amount = amount; }
    public float getInterestRate() { return interestRate; }
    public void setInterestRate(float interestRate) { this.interestRate = interestRate; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Integer getTermMonths() { return termMonths; }
    public void setTermMonths(Integer termMonths) { this.termMonths = termMonths; }
    public CreditStatus getStatus() { return status; }
    public void setStatus(CreditStatus status) { this.status = status; }
    public BigDecimal getIncome() { return income; }
    public void setIncome(BigDecimal income) { this.income = income; }
    public Integer getDependents() { return dependents; }
    public void setDependents(Integer dependents) { this.dependents = dependents; }
    public RiskLevel getRiskLevel() { return riskLevel; }
    public void setRiskLevel(RiskLevel riskLevel) { this.riskLevel = riskLevel; }
    public LocalDateTime getDecisionDate() { return decisionDate; }
    public void setDecisionDate(LocalDateTime decisionDate) { this.decisionDate = decisionDate; }
    public Long getHandledBy() { return handledBy; }
    public void setHandledBy(Long handledBy) { this.handledBy = handledBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<Echeance> getEcheances() { return echeances; }
    public void setEcheances(List<Echeance> echeances) { this.echeances = echeances; }

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

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}