package com.kredia.entity.credit;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.kredia.entity.user.User;
import com.kredia.enums.CreditStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "credit")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Credit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "credit_id")
    private Long creditId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User user;

    // Virtual property for userId
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
}