package com.kredia.entity.credit;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.kredia.enums.EcheanceStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "echeance")
public class Echeance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "echeance_id")
    private Long echeanceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_id", nullable = false)
    @JsonIgnore
    private Credit credit;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "amount_due", nullable = false, precision = 15, scale = 2)
    private BigDecimal amountDue;

    @Column(name = "amount_paid", precision = 15, scale = 2)
    private BigDecimal amountPaid;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EcheanceStatus status;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public Echeance() {}

    public Long getEcheanceId() { return echeanceId; }
    public void setEcheanceId(Long echeanceId) { this.echeanceId = echeanceId; }
    public Credit getCredit() { return credit; }
    public void setCredit(Credit credit) { this.credit = credit; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public BigDecimal getAmountDue() { return amountDue; }
    public void setAmountDue(BigDecimal amountDue) { this.amountDue = amountDue; }
    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
    public EcheanceStatus getStatus() { return status; }
    public void setStatus(EcheanceStatus status) { this.status = status; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
