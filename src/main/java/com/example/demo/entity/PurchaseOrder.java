package com.example.demo.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "purchase_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrder {

    @Id
    private String id;

    private String orderNumber;
    private String supplierId;

    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING_APPROVAL;

    private String createdById;
    private String approvedById;
    private LocalDateTime approvedAt;
    private BigDecimal totalAmount;

    @Builder.Default
    private List<PurchaseOrderItem> items = new ArrayList<>();

    private LocalDateTime createdAt;

    public enum OrderStatus {
        PENDING_APPROVAL, APPROVED, RECEIVED, CANCELLED
    }
}
