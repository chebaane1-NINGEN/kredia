package com.kredia.service.user.impl;

import com.kredia.service.user.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Stub implementation of the user EmailService interface.
 * Delegates to the main EmailService (Brevo) when methods are available,
 * otherwise logs the action.
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Override
    public void sendSecurityAlert(String email, String reason) {
        log.info("Security alert for {}: {}", email, reason);
    }

    @Override
    public void sendWelcomeEmail(String email, String name) {
        log.info("Welcome email to {} ({})", email, name);
    }

    @Override
    public void sendVerificationEmail(String email, String verificationToken) {
        log.info("Verification email to {} with token {}", email, verificationToken);
    }

    @Override
    public void sendPasswordResetEmail(String email, String token) {
        log.info("Password reset email to {} with token {}", email, token);
    }
}
