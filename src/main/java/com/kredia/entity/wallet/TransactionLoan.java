package com.kredia.entity.wallet;
import com.kredia.entity.credit.Echeance;

import com.kredia.entity.credit.Echeance;
import com.kredia.enums.TransactionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "transaction")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionLoan extends Transaction {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "echeance_id")
    private Echeance echnace_id;


}
