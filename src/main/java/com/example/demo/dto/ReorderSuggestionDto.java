package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReorderSuggestionDto {
    private String productId;
    private String sku;
    private String name;
    private Integer currentQuantity;
    private Integer reorderLevel;
    private Integer leadTimeDays;
    private Integer suggestedOrderQty;  // reorderLevel + safety - currentQuantity, or similar
    private BigDecimal unitPrice;
    private String categoryName;
    private String supplierName;
}
