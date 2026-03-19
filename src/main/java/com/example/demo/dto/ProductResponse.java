package com.example.demo.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductResponse {
    private String id;
    private String sku;
    private String name;
    private String description;
    private String categoryId;
    private String categoryName;
    private String supplierId;
    private String supplierName;
    private BigDecimal unitPrice;
    private Integer currentQuantity;
    private Integer reorderLevel;
    private String stockStatus; // STOCKED, LOW, CRITICAL
    private String barcode;
    private String warehouseId;
    private String warehouseName;
    private String warehouseLocation;
    private boolean active;
    private LocalDateTime createdAt;
}
