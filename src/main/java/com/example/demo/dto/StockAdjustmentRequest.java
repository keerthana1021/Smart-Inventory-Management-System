package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StockAdjustmentRequest {
    @NotBlank
    private String productId;
    @NotNull
    private Integer quantity;  // positive = add, negative = subtract
    private String notes;     // e.g. "damage", "count correction"
}
