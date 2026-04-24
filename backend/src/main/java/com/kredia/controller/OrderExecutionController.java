package com.kredia.controller;

import com.kredia.dto.investment.OrderExecutionNotificationDTO;
import com.kredia.entity.investment.InvestmentOrder;
import com.kredia.entity.user.User;
import com.kredia.enums.OrderStatus;
import com.kredia.enums.OrderType;
import com.kredia.repository.InvestmentOrderRepository;
import com.kredia.repository.user.UserRepository;
import com.kredia.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/order-execution")
public class OrderExecutionController {

    private static final Logger log = LoggerFactory.getLogger(OrderExecutionController.class);

    private final EmailService emailService;
    private final InvestmentOrderRepository orderRepository;
    private final UserRepository userRepository;

    public OrderExecutionController(EmailService emailService, InvestmentOrderRepository orderRepository, UserRepository userRepository) {
        this.emailService = emailService;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/notify")
    public ResponseEntity<String> notifyOrderExecution(@RequestBody OrderExecutionNotificationDTO notification) {
        try {
            log.info("Notification d'exécution reçue pour l'ordre {}", notification.getOrderId());

            // Récupérer l'ordre et l'utilisateur
            InvestmentOrder order = orderRepository.findById(notification.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found: " + notification.getOrderId()));

            User user = userRepository.findById(notification.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found: " + notification.getUserId()));

            // Envoyer l'email
            emailService.sendOrderExecutedEmail(user, order, notification.getExecutedPrice());

            return ResponseEntity.ok("Email notification sent successfully");
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error sending notification: " + e.getMessage());
        }
    }
}
