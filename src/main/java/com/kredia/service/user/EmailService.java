package com.kredia.service.user;

public interface EmailService {
    void sendSecurityAlert(String email, String reason);
    void sendWelcomeEmail(String email, String name);
    void sendVerificationEmail(String email, String verificationToken);
    void sendPasswordResetEmail(String email, String token);
}
