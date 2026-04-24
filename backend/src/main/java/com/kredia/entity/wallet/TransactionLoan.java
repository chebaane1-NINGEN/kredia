package com.kredia.entity.wallet;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.kredia.entity.credit.Echeance;
import jakarta.persistence.*;

@Entity
@DiscriminatorValue("TRANSACTION_LOAN")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TransactionLoan extends Transaction {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "echeance_id")
    private Echeance echeance;

    // Getters and Setters
    public Echeance getEcheance() {
        return echeance;
    }

    public void setEcheance(Echeance echeance) {
        this.echeance = echeance;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TransactionLoan)) return false;
        if (!super.equals(o)) return false;

        TransactionLoan that = (TransactionLoan) o;

        return echeance != null ? echeance.equals(that.echeance) : that.echeance == null;
    }

    @Override
    public int hashCode() {
        int result = super.hashCode();
        result = 31 * result + (echeance != null ? echeance.hashCode() : 0);
        return result;
    }

    @Override
    public String toString() {
        return "TransactionLoan{" +
                "echeance=" + echeance +
                "} " + super.toString();
    }
}
