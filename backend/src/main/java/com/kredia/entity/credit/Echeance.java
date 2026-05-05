package com.kredia.entity.credit;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.kredia.enums.EcheanceStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "echeance")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Echeance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "echeance_id")
    private Long echeanceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_id", nullable = false)
    @JsonIgnore
    private Credit credit;

    @JsonProperty("creditId")
    public Long getCreditId() {
        return credit != null ? credit.getCreditId() : null;
    }

    /** Exposé en JSON pour le filtrage par utilisateur en admin */
    @JsonProperty("userId")
    public Long getUserId() {
        return credit != null ? credit.getUserId() : null;
    }

    @Column(name = "echeance_number", nullable = false)
    private Integer echeanceNumber;

    @Column(name = "capital_debut", nullable = false, precision = 15, scale = 2)
    private BigDecimal capitalDebut;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "amount_due", nullable = false, precision = 15, scale = 2)
    private BigDecimal amountDue;

    @Column(name = "principal_due", nullable = false, precision = 15, scale = 2)
    private BigDecimal principalDue;

    @Column(name = "interest_due", nullable = false, precision = 15, scale = 2)
    private BigDecimal interestDue;

    @Column(name = "remaining_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal remainingBalance;

    @Column(name = "amount_paid", precision = 15, scale = 2)
    private BigDecimal amountPaid;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EcheanceStatus status;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
