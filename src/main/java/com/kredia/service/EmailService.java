package com.kredia.service;

import com.kredia.entity.investment.InvestmentOrder;
import com.kredia.entity.user.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import sendinblue.ApiClient;
import sendinblue.ApiException;
import sendinblue.Configuration;
import sendinblue.auth.ApiKeyAuth;
import sibApi.TransactionalEmailsApi;
import sibModel.*;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Collections;

@Service
@Slf4j
public class EmailService {

    private final TransactionalEmailsApi apiInstance;

    @Value("${kredia.mail.from}")
    private String fromEmail;

    @Value("${kredia.mail.from.name}")
    private String fromName;

    public EmailService(@Value("${brevo.api.key}") String apiKey) {
        ApiClient defaultClient = Configuration.getDefaultApiClient();
        ApiKeyAuth apiKeyAuth = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
        apiKeyAuth.setApiKey(apiKey);
        this.apiInstance = new TransactionalEmailsApi();
    }

    @Async
    public void sendOrderExecutedEmail(User user, InvestmentOrder order, BigDecimal executedPrice) {
        try {
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();
            
            // Sender
            SendSmtpEmailSender sender = new SendSmtpEmailSender();
            sender.setEmail(fromEmail);
            sender.setName(fromName);
            sendSmtpEmail.setSender(sender);
            
            // Recipient
            SendSmtpEmailTo recipient = new SendSmtpEmailTo();
            recipient.setEmail(user.getEmail());
            recipient.setName(user.getFirstName() + " " + user.getLastName());
            sendSmtpEmail.setTo(Collections.singletonList(recipient));
            
            // Subject
            sendSmtpEmail.setSubject("✅ Votre ordre a été exécuté - " + order.getAssetSymbol());
            
            // HTML Content
            String htmlContent = buildOrderExecutedEmailHtml(user, order, executedPrice);
            sendSmtpEmail.setHtmlContent(htmlContent);
            
            // Send email via Brevo API
            CreateSmtpEmail result = apiInstance.sendTransacEmail(sendSmtpEmail);
            log.info("Email d'exécution d'ordre envoyé à {} pour l'ordre {} - MessageId: {}", 
                    user.getEmail(), order.getOrderId(), result.getMessageId());
        } catch (ApiException e) {
            log.error("Erreur lors de l'envoi de l'email via Brevo à {}: Code={}, Body={}", 
                    user.getEmail(), e.getCode(), e.getResponseBody(), e);
        } catch (Exception e) {
            log.error("Erreur inattendue lors de l'envoi de l'email à {}: {}", 
                    user.getEmail(), e.getMessage(), e);
        }
    }

    private String buildOrderExecutedEmailHtml(User user, InvestmentOrder order, BigDecimal executedPrice) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String executedAtFormatted = order.getExecutedAt() != null 
            ? order.getExecutedAt().format(formatter) 
            : "N/A";

        String orderTypeColor = order.getOrderType().name().equals("BUY") ? "#10B981" : "#EF4444";
        String orderTypeLabel = order.getOrderType().name().equals("BUY") ? "ACHAT" : "VENTE";

        BigDecimal totalAmount = executedPrice.multiply(order.getQuantity());
        
        String userName = user.getFirstName() + " " + user.getLastName();
        
        // Formater les montants sans zéros inutiles
        String quantityFormatted = order.getQuantity().stripTrailingZeros().toPlainString();
        String executedPriceFormatted = executedPrice.stripTrailingZeros().toPlainString();
        String totalAmountFormatted = totalAmount.stripTrailingZeros().toPlainString();

        // Utiliser String.format au lieu de formatted() pour éviter les problèmes avec # dans le CSS
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; text-align: center; color: white; }
                    .header h1 { margin: 0; font-size: 28px; }
                    .content { padding: 30px; }
                    .success-badge { background-color: #10B981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 20px; }
                    .order-details { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
                    .detail-label { font-weight: 600; color: #6b7280; }
                    .detail-value { font-weight: 700; color: #1f2937; }
                    .order-type { padding: 6px 12px; border-radius: 6px; color: white; font-weight: bold; display: inline-block; }
                    .total-amount { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px; }
                    .total-amount h3 { margin: 0 0 8px 0; color: #1e40af; }
                    .total-amount p { margin: 0; font-size: 24px; font-weight: bold; color: #1e3a8a; }
                    .footer { background-color: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 14px; }
                    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Ordre Exécuté avec Succès</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour <strong>%s</strong>,</p>
                        <div class="success-badge">✅ EXÉCUTÉ</div>
                        <p>Nous avons le plaisir de vous informer que votre ordre d'investissement a été exécuté avec succès.</p>
                        
                        <div class="order-details">
                            <h3 style="margin-top: 0; color: #1f2937;">📊 Détails de l'Ordre</h3>
                            
                            <div class="detail-row">
                                <span class="detail-label">Numéro d'ordre:</span>
                                <span class="detail-value">#%s</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Type d'ordre:</span>
                                <span class="order-type" style="background-color: %s;">%s</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Actif:</span>
                                <span class="detail-value">%s</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Quantité:</span>
                                <span class="detail-value">%s</span>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Prix d'exécution:</span>
                                <span class="detail-value">%s $</span>
                            </div>
                            
                            <div class="detail-row" style="border-bottom: none;">
                                <span class="detail-label">Date d'exécution:</span>
                                <span class="detail-value">%s</span>
                            </div>
                        </div>
                        
                        <div class="total-amount">
                            <h3>💰 Montant Total</h3>
                            <p>%s $</p>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                            Votre portefeuille a été mis à jour automatiquement. Vous pouvez consulter vos positions à tout moment sur votre tableau de bord.
                        </p>
                        
                        <center>
                            <a href="http://localhost:8081/api/investments/orders/%s" class="button">Voir les Détails</a>
                        </center>
                    </div>
                    <div class="footer">
                        <p><strong>Kredia Investment Platform</strong></p>
                        <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
                        <p style="font-size: 12px; margin-top: 10px;">© 2026 Kredia. Tous droits réservés.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
                userName,
                order.getOrderId(),
                orderTypeColor,
                orderTypeLabel,
                order.getAssetSymbol(),
                quantityFormatted,
                executedPriceFormatted,
                executedAtFormatted,
                totalAmountFormatted,
                order.getOrderId()
        );
    }
}
