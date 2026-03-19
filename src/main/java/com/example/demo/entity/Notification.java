package com.example.demo.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    private String id;

    private String userId;
    private String title;
    private String message;
    private NotificationType type;
    private String referenceType;
    private String referenceId;

    @Builder.Default
    private boolean read = false;

    private LocalDateTime createdAt;

    public enum NotificationType {
        LOW_STOCK, ORDER_APPROVED, ORDER_PENDING, SYSTEM_ALERT, STOCK_UPDATE
    }
}
