package com.kredia.controller;

import com.kredia.dto.investment.OrderExecutionNotificationDTO;
import com.kredia.entity.investment.InvestmentOrder;
import com.kredia.entity.User;
import com.kredia.repository.InvestmentOrderRepository;
import com.kredia.repository.UserRepository;
import com.kredia.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/order-execution")
@RequiredArgsConstructor
@Slf4j
public class OrderExecutionController {

    private final EmailService emailService;
    private final InvestmentOrderRepository orderRepository;
    private final UserRepository userRepository;

    @PostMapping("/notify")
    public ResponseEntity<String> notifyOrderExecution(@RequestBody OrderExecutionNotificationDTO notification) {
        try {
            log.info("Notification d'exécution reçue pour l'ordre {}", notification.getId());

            // Récupérer l'ordre et l'utilisateur
            InvestmentOrder order = orderRepository.findById(notification.getId())
                    .orElseThrow(() -> new RuntimeException("Order not found: " + notification.getId()));

            User user = userRepository.findById(notification.getId())
                    .orElseThrow(() -> new RuntimeException("User not found: " + notification.getId()));

            // Envoyer l'email
            emailService.sendOrderExecutedEmail(user, order, notification.getExecutedPrice());

            return ResponseEntity.ok("Email notification sent successfully");
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error sending notification: " + e.getMessage());
        }
    }
}
