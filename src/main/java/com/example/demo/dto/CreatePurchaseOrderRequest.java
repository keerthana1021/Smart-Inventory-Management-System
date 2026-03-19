package com.example.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreatePurchaseOrderRequest {
    @NotNull
    private String supplierId;
    @NotEmpty
    @Valid
    private List<OrderItemDto> items;

    @Data
    public static class OrderItemDto {
        @NotNull
        private String productId;
        @NotNull
        private Integer quantity;
        private java.math.BigDecimal unitPrice;
    }
}
