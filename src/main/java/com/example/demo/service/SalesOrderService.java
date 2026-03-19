package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final AuditService auditService;
    private final NotificationRepository notificationRepository;
    private final NotificationPushService notificationPushService;

    private void notifyUser(String userId,
                             String title,
                             String message,
                             Notification.NotificationType type,
                             String referenceType,
                             String referenceId) {
        if (userId == null || userId.isBlank()) return;
        Notification n = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .createdAt(LocalDateTime.now())
                .build();
        Notification saved = notificationRepository.save(n);
        notificationPushService.pushToUser(userId, saved);
    }

    public SalesOrder create(List<SalesOrderItemDto> items, String customerName, String customerEmail) {
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsername(username).orElse(null);
        String userId = user != null ? user.getId() : null;
        String orderNumber = "SO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        while (salesOrderRepository.existsByOrderNumber(orderNumber))
            orderNumber = "SO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        List<SalesOrderItem> orderItems = new ArrayList<>();
        java.math.BigDecimal total = java.math.BigDecimal.ZERO;
        for (var dto : items) {
            var product = productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            if (product.getCurrentQuantity() < dto.getQuantity())
                throw new BadRequestException("Insufficient stock for " + product.getSku() + ". Available: " + product.getCurrentQuantity());
            var item = SalesOrderItem.builder()
                    .productId(product.getId())
                    .quantity(dto.getQuantity())
                    .unitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : product.getUnitPrice())
                    .build();
            orderItems.add(item);
            total = total.add(item.getLineTotal());
        }

        var order = SalesOrder.builder()
                .orderNumber(orderNumber)
                .status(SalesOrder.OrderStatus.PENDING)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .items(orderItems)
                .totalAmount(total)
                .createdAt(LocalDateTime.now())
                .build();
        order = salesOrderRepository.save(order);
        auditService.log("CREATE_SALES_ORDER", "SalesOrder", order.getId(), null, order.getOrderNumber());
        notifyUser(
                userId,
                "Sales Order Created",
                "Sales order " + order.getOrderNumber() + " has been created and is pending confirmation.",
                Notification.NotificationType.ORDER_PENDING,
                "SALES_ORDER",
                order.getId()
        );
        return order;
    }

    public Page<SalesOrder> findAll(String search, String productId, Pageable pageable) {
        if (productId != null && !productId.isBlank())
            return salesOrderRepository.findByItemsProductId(productId, pageable);
        if (search != null && !search.isBlank())
            return salesOrderRepository.findByOrderNumberContaining(search, pageable);
        return salesOrderRepository.findAll(pageable);
    }

    public SalesOrder getById(String id) {
        return salesOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sales order not found"));
    }

    public SalesOrder confirm(String id) {
        SalesOrder order = salesOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sales order not found"));
        if (order.getStatus() != SalesOrder.OrderStatus.PENDING)
            throw new BadRequestException("Only PENDING orders can be confirmed");
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsername(username).orElse(null);
        String userId = user != null ? user.getId() : null;
        for (var item : order.getItems()) {
            Product p = productRepository.findById(item.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            if (p.getCurrentQuantity() < item.getQuantity())
                throw new BadRequestException("Insufficient stock for " + p.getSku() + ". Available: " + p.getCurrentQuantity());
            int newQty = p.getCurrentQuantity() - item.getQuantity();
            p.setCurrentQuantity(newQty);
            p.setUpdatedAt(LocalDateTime.now());
            productRepository.save(p);
            var tx = InventoryTransaction.builder()
                    .productId(p.getId())
                    .transactionType(InventoryTransaction.TransactionType.OUT)
                    .quantity(-item.getQuantity())
                    .quantityAfter(newQty)
                    .unitPrice(item.getUnitPrice())
                    .referenceType("SALES_ORDER")
                    .referenceId(order.getId())
                    .performedById(userId)
                    .transactionDate(LocalDateTime.now())
                    .notes("Sales order " + order.getOrderNumber() + " confirmed")
                    .build();
            transactionRepository.save(tx);
        }
        order.setStatus(SalesOrder.OrderStatus.CONFIRMED);
        order = salesOrderRepository.save(order);
        auditService.log("CONFIRM_SALES_ORDER", "SalesOrder", order.getId(), "PENDING", "CONFIRMED");
        notifyUser(
                userId,
                "Sales Order Confirmed",
                "Sales order " + order.getOrderNumber() + " has been confirmed. Stock deducted.",
                Notification.NotificationType.ORDER_APPROVED,
                "SALES_ORDER",
                order.getId()
        );
        return order;
    }

    public SalesOrder markShipped(String id) {
        SalesOrder order = salesOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sales order not found"));
        if (order.getStatus() != SalesOrder.OrderStatus.CONFIRMED)
            throw new BadRequestException("Only CONFIRMED orders can be marked as shipped");
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsername(username).orElse(null);
        String userId = user != null ? user.getId() : null;
        order.setStatus(SalesOrder.OrderStatus.SHIPPED);
        order = salesOrderRepository.save(order);
        auditService.log("SHIP_SALES_ORDER", "SalesOrder", order.getId(), "CONFIRMED", "SHIPPED");
        notifyUser(
                userId,
                "Sales Order Shipped",
                "Sales order " + order.getOrderNumber() + " has been marked as shipped.",
                Notification.NotificationType.ORDER_APPROVED,
                "SALES_ORDER",
                order.getId()
        );
        return order;
    }

    public SalesOrder markDelivered(String id) {
        SalesOrder order = salesOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Sales order not found"));
        if (order.getStatus() != SalesOrder.OrderStatus.SHIPPED)
            throw new BadRequestException("Only SHIPPED orders can be marked as delivered");
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsername(username).orElse(null);
        String userId = user != null ? user.getId() : null;
        order.setStatus(SalesOrder.OrderStatus.DELIVERED);
        order = salesOrderRepository.save(order);
        auditService.log("DELIVER_SALES_ORDER", "SalesOrder", order.getId(), "SHIPPED", "DELIVERED");
        notifyUser(
                userId,
                "Sales Order Delivered",
                "Sales order " + order.getOrderNumber() + " has been delivered.",
                Notification.NotificationType.STOCK_UPDATE,
                "SALES_ORDER",
                order.getId()
        );
        return order;
    }

    @lombok.Data
    public static class SalesOrderItemDto {
        private String productId;
        private Integer quantity;
        private java.math.BigDecimal unitPrice;
    }
}
