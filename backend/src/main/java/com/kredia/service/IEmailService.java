package com.kredia.service;

import com.kredia.entity.credit.Echeance;
import com.kredia.entity.investment.InvestmentOrder;
import com.kredia.entity.user.User;

import java.math.BigDecimal;


public interface IEmailService {
    void sendOrderExecutedEmail(User user, InvestmentOrder order, BigDecimal executedPrice);
    void sendEcheancePaidEmail(User user, Echeance echeance);
    void sendEcheancePartiallyPaidEmail(User user, Echeance echeance);
    void sendEcheanceOverdueEmail(User user, Echeance echeance);
    void sendPaymentRejectedChronologicalEmail(User user, Echeance echeance);
}
