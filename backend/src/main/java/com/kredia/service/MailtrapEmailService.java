package com.kredia.service;

import com.kredia.entity.credit.Echeance;
import com.kredia.entity.investment.InvestmentOrder;
import com.kredia.entity.user.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

/**
 * Mailtrap email service using SMTP via JavaMailSender.
 * Activated when mail.provider=mailtrap in application.properties.
 * Configure SMTP credentials in secrets.properties.
 */
@Service
@Slf4j
@ConditionalOnProperty(name = "mail.provider", havingValue = "mailtrap")
public class MailtrapEmailService implements IEmailService {

    private final JavaMailSender mailSender;

    @Value("${mailtrap.from.email}")
    private String fromEmail;

    @Value("${mailtrap.from.name}")
    private String fromName;

    // Queue to serialize email sending — Mailtrap free plan: 1 email/second
    private final BlockingQueue<Runnable> emailQueue = new LinkedBlockingQueue<>();
    private final ScheduledExecutorService emailWorker = Executors.newSingleThreadScheduledExecutor();
    // Track emails already queued to avoid duplicates
    private final java.util.Set<String> queuedKeys = java.util.Collections
            .newSetFromMap(new java.util.concurrent.ConcurrentHashMap<>());

    public MailtrapEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
        // Process one email every 2 seconds to respect Mailtrap free plan rate limit
        emailWorker.scheduleAtFixedRate(() -> {
            Runnable task = emailQueue.poll();
            if (task != null) {
                task.run();
            }
        }, 2000, 2000, java.util.concurrent.TimeUnit.MILLISECONDS);
    }

    // ─── Send helper ─────────────────────────────────────────────────────────

    private void send(String to, String toName, String subject, String html) {
        // Deduplicate: same recipient + subject = skip if already queued or recently sent
        String key = to + "|" + subject;
        if (queuedKeys.add(key)) {
            emailQueue.offer(() -> {
                doSend(to, subject, html);
                // Keep key for 60 seconds to prevent duplicates from schedulers
                emailWorker.schedule(() -> queuedKeys.remove(key), 60, java.util.concurrent.TimeUnit.SECONDS);
            });
        } else {
            log.debug("Email already queued for {} — subject: {}", to, subject);
        }
    }

    private void doSend(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Mailtrap email sent to {} — subject: {}", to, subject);
        } catch (Exception e) {
            log.warn("Mailtrap email skipped for {}: {}", to, e.getMessage());
        }
    }

    // ─── IEmailService methods ────────────────────────────────────────────────

    @Override
    public void sendOrderExecutedEmail(User user, InvestmentOrder order, BigDecimal executedPrice) {
        String subject = "✅ Your order has been executed - " + order.getAssetSymbol();
        send(user.getEmail(), fullName(user), subject, buildOrderExecutedHtml(user, order, executedPrice));
    }

    @Override
    public void sendEcheancePaidEmail(User user, Echeance echeance) {
        String subject = "✅ Payment Receipt - Installment #" + echeance.getEcheanceNumber();
        send(user.getEmail(), fullName(user), subject, buildEcheancePaidHtml(user, echeance));
    }

    @Override
    public void sendEcheancePartiallyPaidEmail(User user, Echeance echeance) {
        String subject = "⚠️ Partial Payment Receipt - Installment #" + echeance.getEcheanceNumber();
        send(user.getEmail(), fullName(user), subject, buildEcheancePartiallyPaidHtml(user, echeance));
    }

    @Override
    public void sendEcheanceOverdueEmail(User user, Echeance echeance) {
        String subject = "🚨 Overdue Payment Notice - Installment #" + echeance.getEcheanceNumber();
        send(user.getEmail(), fullName(user), subject, buildEcheanceOverdueHtml(user, echeance));
    }

    @Override
    public void sendPaymentRejectedChronologicalEmail(User user, Echeance echeance) {
        String subject = "❌ Payment Suspended - Previous Unpaid Installments";
        send(user.getEmail(), fullName(user), subject, buildPaymentRejectedHtml(user, echeance));
    }

    // ─── HTML builders ────────────────────────────────────────────────────────

    private String buildOrderExecutedHtml(User user, InvestmentOrder order, BigDecimal executedPrice) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String executedAt = order.getExecutedAt() != null ? order.getExecutedAt().format(fmt) : "N/A";
        String typeColor = "BUY".equals(order.getOrderType().name()) ? "#10B981" : "#EF4444";
        String typeLabel = "BUY".equals(order.getOrderType().name()) ? "BUY" : "SELL";
        BigDecimal total = executedPrice.multiply(order.getQuantity());

        return String.format("""
            <!DOCTYPE html><html><head><meta charset="UTF-8">
            <style>
              body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
              .c{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)}
              .h{background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;text-align:center;color:#fff}
              .h h1{margin:0;font-size:28px} .b{padding:30px}
              .badge{background:#10B981;color:#fff;padding:8px 16px;border-radius:20px;display:inline-block;font-weight:700;margin-bottom:20px}
              .box{background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0}
              .row{display:flex;justify-content:space-between;margin:12px 0;padding:8px 0;border-bottom:1px solid #e5e7eb}
              .lbl{font-weight:600;color:#6b7280} .val{font-weight:700;color:#1f2937}
              .total{background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:20px 0;border-radius:4px}
              .total h3{margin:0 0 8px;color:#1e40af} .total p{margin:0;font-size:24px;font-weight:700;color:#1e3a8a}
              .f{background:#f9fafb;padding:20px 30px;text-align:center;color:#6b7280;font-size:14px}
            </style></head><body>
            <div class="c">
              <div class="h"><h1>🎉 Order Executed Successfully</h1></div>
              <div class="b">
                <p>Hello <strong>%s</strong>,</p>
                <div class="badge">✅ EXECUTED</div>
                <p>Your investment order has been executed successfully.</p>
                <div class="box">
                  <h3 style="margin-top:0;color:#1f2937">📊 Order Details</h3>
                  <div class="row"><span class="lbl">Order Number:</span><span class="val">#%s</span></div>
                  <div class="row"><span class="lbl">Type:</span><span style="background:%s;color:#fff;padding:4px 10px;border-radius:6px;font-weight:700">%s</span></div>
                  <div class="row"><span class="lbl">Asset:</span><span class="val">%s</span></div>
                  <div class="row"><span class="lbl">Quantity:</span><span class="val">%s</span></div>
                  <div class="row"><span class="lbl">Execution Price:</span><span class="val">%s $</span></div>
                  <div class="row" style="border-bottom:none"><span class="lbl">Date:</span><span class="val">%s</span></div>
                </div>
                <div class="total"><h3>💰 Total Amount</h3><p>%s $</p></div>
              </div>
              <div class="f"><p><strong>Kredia Investment Platform</strong></p><p>Automatic email — do not reply.</p></div>
            </div></body></html>
            """,
            fullName(user), order.getOrderId(), typeColor, typeLabel,
            order.getAssetSymbol(),
            order.getQuantity().stripTrailingZeros().toPlainString(),
            executedPrice.stripTrailingZeros().toPlainString(),
            executedAt,
            total.stripTrailingZeros().toPlainString()
        );
    }

    private String buildEcheancePaidHtml(User user, Echeance echeance) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String paidAt = echeance.getPaidAt() != null ? echeance.getPaidAt().format(fmt) : "N/A";
        String dueDate = echeance.getDueDate() != null ? echeance.getDueDate().format(dateFmt) : "N/A";
        String paid = echeance.getAmountPaid() != null ? echeance.getAmountPaid().stripTrailingZeros().toPlainString() : "0";
        String due = echeance.getAmountDue() != null ? echeance.getAmountDue().stripTrailingZeros().toPlainString() : "0";

        return String.format("""
            <!DOCTYPE html><html><head><meta charset="UTF-8">
            <style>
              body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
              .c{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)}
              .h{background:linear-gradient(135deg,#10B981,#059669);padding:30px;text-align:center;color:#fff}
              .h h1{margin:0;font-size:28px} .b{padding:30px}
              .badge{background:#10B981;color:#fff;padding:8px 16px;border-radius:20px;display:inline-block;font-weight:700;margin-bottom:20px}
              .box{background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0}
              .row{display:flex;justify-content:space-between;margin:12px 0;padding:8px 0;border-bottom:1px solid #e5e7eb}
              .lbl{font-weight:600;color:#6b7280} .val{font-weight:700;color:#1f2937}
              .total{background:#ecfdf5;border-left:4px solid #10B981;padding:16px;margin:20px 0;border-radius:4px}
              .total h3{margin:0 0 8px;color:#047857} .total p{margin:0;font-size:24px;font-weight:700;color:#065f46}
              .f{background:#f9fafb;padding:20px 30px;text-align:center;color:#6b7280;font-size:14px}
            </style></head><body>
            <div class="c">
              <div class="h"><h1>✅ Payment Receipt</h1></div>
              <div class="b">
                <p>Hello <strong>%s</strong>,</p>
                <div class="badge">PAID</div>
                <p>We confirm the receipt of your payment.</p>
                <div class="box">
                  <h3 style="margin-top:0;color:#1f2937">📊 Installment Details</h3>
                  <div class="row"><span class="lbl">Number:</span><span class="val">#%s</span></div>
                  <div class="row"><span class="lbl">Due Date:</span><span class="val">%s</span></div>
                  <div class="row"><span class="lbl">Initial Amount:</span><span class="val">%s TND</span></div>
                  <div class="row" style="border-bottom:none"><span class="lbl">Payment Date:</span><span class="val">%s</span></div>
                </div>
                <div class="total"><h3>💰 Amount Paid</h3><p>%s TND</p></div>
              </div>
              <div class="f"><p><strong>Kredia Platform</strong></p><p>Automatic email — do not reply.</p></div>
            </div></body></html>
            """,
            fullName(user), echeance.getEcheanceNumber(), dueDate, due, paidAt, paid
        );
    }

    private String buildEcheancePartiallyPaidHtml(User user, Echeance echeance) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String paidAt = echeance.getPaidAt() != null ? echeance.getPaidAt().format(fmt) : "N/A";
        String dueDate = echeance.getDueDate() != null ? echeance.getDueDate().format(dateFmt) : "N/A";
        String paid = echeance.getAmountPaid() != null ? echeance.getAmountPaid().stripTrailingZeros().toPlainString() : "0";
        String due = echeance.getAmountDue() != null ? echeance.getAmountDue().stripTrailingZeros().toPlainString() : "0";
        BigDecimal remaining = echeance.getAmountDue().subtract(echeance.getAmountPaid() != null ? echeance.getAmountPaid() : BigDecimal.ZERO);
        String rem = remaining.stripTrailingZeros().toPlainString();

        return String.format("""
            <!DOCTYPE html><html><head><meta charset="UTF-8">
            <style>
              body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
              .c{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)}
              .h{background:linear-gradient(135deg,#F59E0B,#D97706);padding:30px;text-align:center;color:#fff}
              .h h1{margin:0;font-size:28px} .b{padding:30px}
              .badge{background:#F59E0B;color:#fff;padding:8px 16px;border-radius:20px;display:inline-block;font-weight:700;margin-bottom:20px}
              .box{background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0}
              .row{display:flex;justify-content:space-between;margin:12px 0;padding:8px 0;border-bottom:1px solid #e5e7eb}
              .lbl{font-weight:600;color:#6b7280} .val{font-weight:700;color:#1f2937}
              .total{background:#fef3c7;border-left:4px solid #F59E0B;padding:16px;margin:20px 0;border-radius:4px}
              .total h3{margin:0 0 8px;color:#b45309} .total p{margin:0;font-size:24px;font-weight:700;color:#92400e}
              .f{background:#f9fafb;padding:20px 30px;text-align:center;color:#6b7280;font-size:14px}
            </style></head><body>
            <div class="c">
              <div class="h"><h1>⚠️ Partial Payment Receipt</h1></div>
              <div class="b">
                <p>Hello <strong>%s</strong>,</p>
                <div class="badge">PARTIALLY PAID</div>
                <p>We confirm the receipt of a partial payment for your installment.</p>
                <div class="box">
                  <h3 style="margin-top:0;color:#1f2937">📊 Installment Details</h3>
                  <div class="row"><span class="lbl">Number:</span><span class="val">#%s</span></div>
                  <div class="row"><span class="lbl">Due Date:</span><span class="val">%s</span></div>
                  <div class="row"><span class="lbl">Initial Amount:</span><span class="val">%s TND</span></div>
                  <div class="row" style="border-bottom:none"><span class="lbl">Payment Date:</span><span class="val">%s</span></div>
                </div>
                <div class="total">
                  <h3>💰 Amount Paid</h3><p>%s TND</p>
                  <h3 style="margin-top:15px">⚠️ Remaining Balance</h3><p>%s TND</p>
                </div>
              </div>
              <div class="f"><p><strong>Kredia Platform</strong></p><p>Automatic email — do not reply.</p></div>
            </div></body></html>
            """,
            fullName(user), echeance.getEcheanceNumber(), dueDate, due, paidAt, paid, rem
        );
    }

    private String buildEcheanceOverdueHtml(User user, Echeance echeance) {
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String dueDate = echeance.getDueDate() != null ? echeance.getDueDate().format(dateFmt) : "N/A";
        String due = echeance.getAmountDue() != null ? echeance.getAmountDue().stripTrailingZeros().toPlainString() : "0";

        return String.format("""
            <!DOCTYPE html><html><head><meta charset="UTF-8">
            <style>
              body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
              .c{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)}
              .h{background:linear-gradient(135deg,#EF4444,#B91C1C);padding:30px;text-align:center;color:#fff}
              .h h1{margin:0;font-size:28px} .b{padding:30px}
              .badge{background:#EF4444;color:#fff;padding:8px 16px;border-radius:20px;display:inline-block;font-weight:700;margin-bottom:20px}
              .box{background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0}
              .row{display:flex;justify-content:space-between;margin:12px 0;padding:8px 0;border-bottom:1px solid #e5e7eb}
              .lbl{font-weight:600;color:#6b7280} .val{font-weight:700;color:#1f2937}
              .total{background:#fef2f2;border-left:4px solid #EF4444;padding:16px;margin:20px 0;border-radius:4px}
              .total h3{margin:0 0 8px;color:#991b1b} .total p{margin:0;font-size:24px;font-weight:700;color:#7f1d1d}
              .f{background:#f9fafb;padding:20px 30px;text-align:center;color:#6b7280;font-size:14px}
            </style></head><body>
            <div class="c">
              <div class="h"><h1>🚨 Overdue Payment Notice</h1></div>
              <div class="b">
                <p>Hello <strong>%s</strong>,</p>
                <div class="badge">OVERDUE</div>
                <p>We have not received the full payment for your installment by its due date.</p>
                <div class="box">
                  <h3 style="margin-top:0;color:#1f2937">📊 Installment Details</h3>
                  <div class="row"><span class="lbl">Number:</span><span class="val">#%s</span></div>
                  <div class="row" style="border-bottom:none"><span class="lbl">Due Date:</span><span class="val" style="color:#EF4444">%s (Expired)</span></div>
                </div>
                <div class="total"><h3>⚠️ Amount Due (including penalties)</h3><p>%s TND</p></div>
              </div>
              <div class="f"><p><strong>Kredia Platform</strong></p><p>Automatic email — do not reply.</p></div>
            </div></body></html>
            """,
            fullName(user), echeance.getEcheanceNumber(), dueDate, due
        );
    }

    private String buildPaymentRejectedHtml(User user, Echeance echeance) {
        return String.format("""
            <!DOCTYPE html><html><head><meta charset="UTF-8">
            <style>
              body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
              .c{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)}
              .h{background:linear-gradient(135deg,#EF4444,#B91C1C);padding:30px;text-align:center;color:#fff}
              .h h1{margin:0;font-size:28px} .b{padding:30px}
              .badge{background:#EF4444;color:#fff;padding:8px 16px;border-radius:20px;display:inline-block;font-weight:700;margin-bottom:20px}
              .box{background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0}
              .f{background:#f9fafb;padding:20px 30px;text-align:center;color:#6b7280;font-size:14px}
            </style></head><body>
            <div class="c">
              <div class="h"><h1>❌ Operation Suspended</h1></div>
              <div class="b">
                <p>Hello <strong>%s</strong>,</p>
                <div class="badge">PAYMENT BLOCKED</div>
                <p>Payment failed for installment <strong>#%s</strong>.</p>
                <div class="box">
                  <h3 style="margin-top:0;color:#1f2937">⚠️ Rejection Reason</h3>
                  <p style="color:#4b5563">You must first settle all your previous overdue installments.</p>
                </div>
              </div>
              <div class="f"><p><strong>Kredia Platform</strong></p><p>Automatic email — do not reply.</p></div>
            </div></body></html>
            """,
            fullName(user), echeance.getEcheanceNumber()
        );
    }

    private String fullName(User user) {
        return user.getFirstName() + " " + user.getLastName();
    }
}
