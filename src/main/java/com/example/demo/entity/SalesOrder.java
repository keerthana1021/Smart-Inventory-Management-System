package com.example.demo.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "sales_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrder {

    @Id
    private String id;

    private String orderNumber;

    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    private BigDecimal totalAmount;
    private String customerName;
    private String customerEmail;

    @Builder.Default
    private List<SalesOrderItem> items = new ArrayList<>();

    private LocalDateTime createdAt;

    public enum OrderStatus {
        PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    }
}
