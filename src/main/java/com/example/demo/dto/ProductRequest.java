package com.example.demo.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {
    @NotBlank
    private String sku;
    @NotBlank
    private String name;
    private String description;
    @NotNull
    private String categoryId;
    private String supplierId;
    @NotNull @DecimalMin("0")
    private BigDecimal unitPrice;
    private Integer currentQuantity = 0;
    @Min(0)
    private Integer reorderLevel = 5;
    private Integer safetyStock = 0;
    private Integer leadTimeDays = 7;
    private String warehouseId;
    private String warehouseLocation;
    private String barcode;
    private boolean active = true;
}
