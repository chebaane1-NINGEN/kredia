package com.kredia.entity.credit;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.kredia.entity.user.User;
import com.kredia.enums.CreditStatus;
import com.kredia.enums.RepaymentType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "demande_credit")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandeCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_demande_credit")
    @JsonProperty("creditId")
    private Long id;

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
    @Min(value = 500, message = "Le montant minimum est de 500 DT")
    @Max(value = 10000, message = "Le montant maximum est de 10000 DT")
    private Float amount;

    @NotNull(message = "La durée en mois est obligatoire")
    @Positive(message = "La durée en mois doit être positive")
    private Integer termMonths;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate startDate;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate endDate;

    @NotNull(message = "Le type de remboursement est obligatoire")
    @Enumerated(EnumType.STRING)
    private RepaymentType repaymentType;

    @NotNull(message = "Le revenu est obligatoire")
    @Positive(message = "Le revenu doit être positif")
    private BigDecimal income;

    @NotNull(message = "Le nombre de personnes à charge est obligatoire")
    @Min(0)
    private Integer dependents;

    @Enumerated(EnumType.STRING)
    private CreditStatus status = CreditStatus.PENDING;

    /** Rempli après approbation — référence le crédit officiel créé */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_id", nullable = true)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Credit credit;

    @JsonProperty("creditOfficielId")
    public Long getCreditOfficielId() {
        return credit != null ? credit.getCreditId() : null;
    }

    private LocalDateTime createdAt;

    @JsonProperty("applicationFee")
    private Float applicationFee;

    @JsonProperty("isFeePaid")
    private Boolean isFeePaid;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = CreditStatus.PENDING;
        if (applicationFee == null && amount != null) {
            applicationFee = amount * 0.02f;
        }
        if (isFeePaid == null) isFeePaid = false;
    }
}
