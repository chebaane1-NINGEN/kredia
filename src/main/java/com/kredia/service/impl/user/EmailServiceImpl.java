package com.kredia.service.impl.user;

import com.kredia.service.user.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${kredia.mail.from:no-reply@kredia.com}")
    private String mailFrom;

    @Value("${kredia.mail.from.name:Kredia}")
    private String mailFromName;

    @Override
    public void sendSecurityAlert(String email, String reason) {
        String subject = "Security Alert: Account blocked";
        String html = "<p>Your Kredia account has been blocked for security reasons.</p>" +
                "<p>Reason: " + reason + "</p>" +
                "<p>Please contact support if you did not perform these actions.</p>";
        sendEmail(email, subject, html);
        log.info("📧 [SECURITY ALERT] Security alert email prepared for {}", email);
    }

    @Override
    public void sendWelcomeEmail(String email, String name) {
        String subject = "Welcome to Kredia";
        String html = "<p>Hi " + name + ",</p>" +
                "<p>Welcome to Kredia. Your account was successfully created.</p>" +
                "<p>If you registered with Google, you can access the platform immediately.</p>";
        sendEmail(email, subject, html);
        log.info("📧 [WELCOME] Welcome email prepared for {}", email);
    }

    @Override
    public void sendVerificationEmail(String email, String verificationToken) {
        String verificationUrl = "http://localhost:5173/verify?token=" + verificationToken;
        String subject = "Verify Your Kredia Email";
        String html = "<p>Hello,</p>" +
                "<p>Thank you for registering with Kredia. Please verify your email by clicking the link below:</p>" +
                "<p><a href=\"" + verificationUrl + "\">Verify my email</a></p>" +
                "<p>If you did not request this, please ignore this message.</p>";
        sendEmail(email, subject, html);
        log.info("📧 [VERIFICATION] Verification email prepared for {}: {}", email, verificationUrl);
    }

    @Override
    public void sendPasswordResetEmail(String email, String token) {
        String resetUrl = "http://localhost:5173/reset-password?token=" + token;
        String subject = "Reset Your Kredia Password";
        String html = "<p>Hello,</p>" +
                "<p>You requested a password reset for your Kredia account. Click the link below to set a new password:</p>" +
                "<p><a href=\"" + resetUrl + "\">Reset my password</a></p>" +
                "<p>If you didn't request it, ignore this email.</p>";
        sendEmail(email, subject, html);
        log.info("📧 [PASSWORD RESET] Password reset email prepared for {}: {}", email, resetUrl);
    }

    private void sendEmail(String recipient, String subject, String htmlContent) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            log.info("📧 [EMAIL STUB] To={} Subject={} HTML={}", recipient, subject, htmlContent);
            return;
        }

        try {
            URL url = new URL("https://api.brevo.com/v3/smtp/email");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("api-key", brevoApiKey);

            String payload = "{"
                    + "\"sender\":{\"name\":\"" + mailFromName + "\",\"email\":\"" + mailFrom + "\"},"
                    + "\"to\":[{\"email\":\"" + recipient + "\"}],"
                    + "\"subject\":\"" + escapeJson(subject) + "\","
                    + "\"htmlContent\":\"" + escapeJson(htmlContent) + "\""
                    + "}";

            try (OutputStream os = conn.getOutputStream()) {
                os.write(payload.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            if (responseCode >= 400) {
                log.warn("📧 [BREVO] Email delivery failed with status {} for {}", responseCode, recipient);
            } else {
                log.info("📧 [BREVO] Email delivered to {} (status {})", recipient, responseCode);
            }
        } catch (Exception ex) {
            log.error("📧 [BREVO] Failed to send email to {}", recipient, ex);
        }
    }

    private String escapeJson(String raw) {
        return raw.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
