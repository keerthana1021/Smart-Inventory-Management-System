package com.example.demo.service;

import com.example.demo.entity.Notification;
import com.example.demo.entity.Product;
import com.example.demo.entity.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LowStockScheduledJob {

    private final ProductRepository productRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationPushService notificationPushService;

    @Autowired(required = false)
    private EmailService emailService;

    @Value("${app.low-stock.email-enabled:false}")
    private boolean emailEnabled;

    @Scheduled(cron = "${app.low-stock.cron:0 0 8 * * ?}")
    public void checkLowStockAndNotify() {
        List<Product> lowStock = productRepository.findLowStockProducts();
        if (lowStock.isEmpty()) return;
        var now = LocalDateTime.now();
        List<User> users = userRepository.findAll();

        for (User user : users) {
            for (Product p : lowStock) {
                Notification n = Notification.builder()
                        .userId(user.getId())
                        .title("Low Stock Alert")
                        .message("Product " + p.getSku() + " (" + p.getName() + ") is below reorder level. Current: " + p.getCurrentQuantity())
                        .type(Notification.NotificationType.LOW_STOCK)
                        .referenceType("Product")
                        .referenceId(p.getId())
                        .createdAt(now)
                        .build();
                n = notificationRepository.save(n);
                notificationPushService.pushToUser(user.getId(), n);
            }
        }

        if (emailEnabled && emailService != null) {
            List<String> emails = users.stream()
                    .map(User::getEmail)
                    .filter(e -> e != null && !e.isBlank())
                    .distinct()
                    .collect(Collectors.toList());
            if (!emails.isEmpty()) {
                StringBuilder body = new StringBuilder("Low stock alert:\n\n");
                for (Product p : lowStock) {
                    body.append("- ").append(p.getSku()).append(" (").append(p.getName()).append("): ")
                            .append(p.getCurrentQuantity()).append(" (reorder: ").append(p.getReorderLevel()).append(")\n");
                }
                emailService.sendLowStockAlert(emails, "Smart Inventory - Low Stock Alert", body.toString());
            }
        }
    }
}
