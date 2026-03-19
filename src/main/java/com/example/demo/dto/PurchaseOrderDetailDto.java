package com.example.demo.dto;

import com.example.demo.entity.PurchaseOrder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class PurchaseOrderDetailDto {
    private String id;
    private String orderNumber;
    private String supplierId;
    private String supplierName;
    private PurchaseOrder.OrderStatus status;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private List<LineItemDto> items;

    @Data
    public static class LineItemDto {
        private String productId;
        private String productSku;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }
}
