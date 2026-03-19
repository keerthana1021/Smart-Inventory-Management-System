package com.example.demo.dto;

import com.example.demo.entity.PurchaseOrder;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PurchaseOrderListDto {
    private String id;
    private String orderNumber;
    private String supplierName;
    private PurchaseOrder.OrderStatus status;
    private BigDecimal totalAmount;

    public static PurchaseOrderListDto from(PurchaseOrder order) {
        return from(order, null);
    }

    public static PurchaseOrderListDto from(PurchaseOrder order, String supplierName) {
        var dto = new PurchaseOrderListDto();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setSupplierName(supplierName);
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        return dto;
    }
}
