package com.kredia.entity.wallet;

import com.kredia.entity.credit.Echeance;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "transaction")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
public class TransactionLoan extends Transaction {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "echeance_id")
    private Echeance echnace_id;

}
