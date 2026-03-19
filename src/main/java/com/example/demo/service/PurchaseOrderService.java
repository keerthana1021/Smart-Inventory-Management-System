package com.example.demo.service;

import com.example.demo.dto.PurchaseOrderListDto;
import com.example.demo.entity.*;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
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

    public PurchaseOrder create(String supplierId, List<PurchaseOrderItemDto> items) {
        if (items == null || items.isEmpty()) throw new BadRequestException("At least one item required");
        supplierRepository.findById(supplierId).orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsername(username).orElse(null);
        String userId = user != null ? user.getId() : null;
        String orderNumber = "PO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        while (purchaseOrderRepository.existsByOrderNumber(orderNumber))
            orderNumber = "PO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        List<PurchaseOrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (var dto : items) {
            var product = productRepository.findById(dto.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            var item = PurchaseOrderItem.builder()
                    .productId(product.getId())
                    .quantity(dto.getQuantity())
                    .unitPrice(dto.getUnitPrice() != null ? dto.getUnitPrice() : product.getUnitPrice())
                    .build();
            orderItems.add(item);
            total = total.add(item.getLineTotal());
        }

        var order = PurchaseOrder.builder()
                .orderNumber(orderNumber)
                .supplierId(supplierId)
                .status(PurchaseOrder.OrderStatus.PENDING_APPROVAL)
                .createdById(userId)
                .items(orderItems)
                .totalAmount(total)
                .createdAt(LocalDateTime.now())
                .build();
        order = purchaseOrderRepository.save(order);
        auditService.log("CREATE_PURCHASE_ORDER", "PurchaseOrder", order.getId(), null, order.getOrderNumber());
        notifyUser(
                userId,
                "Purchase Order Created",
                "Purchase order " + order.getOrderNumber() + " has been created and is pending approval.",
                Notification.NotificationType.ORDER_PENDING,
                "PURCHASE_ORDER",
                order.getId()
        );
        return order;
    }

    /** Approve order (Manager/Admin) – moves PENDING_APPROVAL → APPROVED. No stock update yet. */
    public PurchaseOrder approve(String id) {
        var order = purchaseOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Purchase order not found"));
        if (order.getStatus() != PurchaseOrder.OrderStatus.PENDING_APPROVAL)
            throw new BadRequestException("Order is not pending approval");
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsername(username).orElse(null);
        String userId = user != null ? user.getId() : null;
        order.setStatus(PurchaseOrder.OrderStatus.APPROVED);
        order.setApprovedById(userId);
        order.setApprovedAt(LocalDateTime.now());
        purchaseOrderRepository.save(order);
        auditService.log("APPROVE_PURCHASE_ORDER", "PurchaseOrder", order.getId(), "PENDING_APPROVAL", "APPROVED");
        notifyUser(
                userId,
                "Purchase Order Approved",
                "Purchase order " + order.getOrderNumber() + " has been approved.",
                Notification.NotificationType.ORDER_APPROVED,
                "PURCHASE_ORDER",
                order.getId()
        );
        return order;
    }

    /** Receive goods – moves APPROVED → RECEIVED, updates stock and ledger. */
    public PurchaseOrder receive(String id) {
        var order = purchaseOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Purchase order not found"));
        if (order.getStatus() != PurchaseOrder.OrderStatus.APPROVED)
            throw new BadRequestException("Order must be approved before receiving. Current status: " + order.getStatus());
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsername(username).orElse(null);
        String userId = user != null ? user.getId() : null;

        for (var item : order.getItems()) {
            Product p = productRepository.findById(item.getProductId()).orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            int newQty = p.getCurrentQuantity() + item.getQuantity();
            p.setCurrentQuantity(newQty);
            p.setUpdatedAt(LocalDateTime.now());
            productRepository.save(p);
            var tx = InventoryTransaction.builder()
                    .productId(p.getId())
                    .transactionType(InventoryTransaction.TransactionType.IN)
                    .quantity(item.getQuantity())
                    .quantityAfter(newQty)
                    .unitPrice(item.getUnitPrice())
                    .referenceType("PURCHASE_ORDER")
                    .referenceId(order.getId())
                    .performedById(userId)
                    .transactionDate(LocalDateTime.now())
                    .notes("Purchase order " + order.getOrderNumber() + " received")
                    .build();
            transactionRepository.save(tx);
        }
        order.setStatus(PurchaseOrder.OrderStatus.RECEIVED);
        purchaseOrderRepository.save(order);
        auditService.log("RECEIVE_PURCHASE_ORDER", "PurchaseOrder", order.getId(), "APPROVED", "RECEIVED");
        notifyUser(
                userId,
                "Purchase Order Received",
                "Purchase order " + order.getOrderNumber() + " has been received. Stock updated.",
                Notification.NotificationType.STOCK_UPDATE,
                "PURCHASE_ORDER",
                order.getId()
        );
        return order;
    }

    /** Reject/cancel order – moves PENDING_APPROVAL or APPROVED → CANCELLED. */
    public PurchaseOrder reject(String id) {
        var order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found"));
        if (order.getStatus() == PurchaseOrder.OrderStatus.RECEIVED) {
            throw new BadRequestException("Received orders cannot be cancelled");
        }
        if (order.getStatus() == PurchaseOrder.OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsername(username).orElse(null);
        String userId = user != null ? user.getId() : null;
        var old = order.getStatus().name();
        order.setStatus(PurchaseOrder.OrderStatus.CANCELLED);
        purchaseOrderRepository.save(order);
        auditService.log("REJECT_PURCHASE_ORDER", "PurchaseOrder", order.getId(), old, "CANCELLED");
        notifyUser(
                userId,
                "Purchase Order Rejected",
                "Purchase order " + order.getOrderNumber() + " was rejected/cancelled.",
                Notification.NotificationType.SYSTEM_ALERT,
                "PURCHASE_ORDER",
                order.getId()
        );
        return order;
    }

    public Page<PurchaseOrder> findAll(String search, PurchaseOrder.OrderStatus status, String productId, Pageable pageable) {
        if (productId != null && !productId.isBlank())
            return purchaseOrderRepository.findByItemsProductId(productId, pageable);
        if (status != null) {
            if (search != null && !search.isBlank())
                return purchaseOrderRepository.findByOrderNumberContainingAndStatus(search.trim(), status, pageable);
            return purchaseOrderRepository.findByStatus(status, pageable);
        }
        if (search != null && !search.isBlank())
            return purchaseOrderRepository.findByOrderNumberContaining(search.trim(), pageable);
        return purchaseOrderRepository.findAll(pageable);
    }

    public Page<PurchaseOrderListDto> findAllDtos(String search, PurchaseOrder.OrderStatus status, String productId, Pageable pageable) {
        Page<PurchaseOrder> page = findAll(search, status, productId, pageable);
        List<PurchaseOrderListDto> dtos = page.getContent().stream()
                .map(o -> PurchaseOrderListDto.from(o, o.getSupplierId() != null ? supplierRepository.findById(o.getSupplierId()).map(Supplier::getName).orElse(null) : null))
                .toList();
        return new PageImpl<>(dtos, pageable, page.getTotalElements());
    }

    public PurchaseOrder getById(String id) {
        return purchaseOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Purchase order not found"));
    }

    public com.example.demo.dto.PurchaseOrderDetailDto getDetailById(String id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Purchase order not found"));
        var dto = new com.example.demo.dto.PurchaseOrderDetailDto();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setSupplierId(order.getSupplierId());
        dto.setSupplierName(order.getSupplierId() != null ? supplierRepository.findById(order.getSupplierId()).map(Supplier::getName).orElse(null) : null);
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setCreatedAt(order.getCreatedAt());
        var items = order.getItems() != null ? order.getItems() : List.<PurchaseOrderItem>of();
        dto.setItems(items.stream().map(item -> {
            var line = new com.example.demo.dto.PurchaseOrderDetailDto.LineItemDto();
            line.setProductId(item.getProductId());
            line.setQuantity(item.getQuantity());
            line.setUnitPrice(item.getUnitPrice());
            line.setLineTotal(item.getLineTotal());
            productRepository.findById(item.getProductId()).ifPresent(p -> {
                line.setProductSku(p.getSku());
                line.setProductName(p.getName());
            });
            return line;
        }).collect(Collectors.toList()));
        return dto;
    }

    @lombok.Data
    public static class PurchaseOrderItemDto {
        private String productId;
        private Integer quantity;
        private java.math.BigDecimal unitPrice;
    }
}
