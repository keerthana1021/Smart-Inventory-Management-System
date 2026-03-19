package com.example.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateSalesOrderRequest {
    @NotEmpty
    @Valid
    private List<OrderItemDto> items;
    private String customerName;
    private String customerEmail;

    @Data
    public static class OrderItemDto {
        private String productId;
        private Integer quantity;
        private java.math.BigDecimal unitPrice;
    }
}
