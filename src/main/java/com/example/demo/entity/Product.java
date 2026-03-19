package com.example.demo.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "products")
@CompoundIndexes({
        @CompoundIndex(name = "idx_products_active_category", def = "{'active':1,'categoryId':1}"),
        @CompoundIndex(name = "idx_products_active_qty_reorder", def = "{'active':1,'currentQuantity':1,'reorderLevel':1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    private String id;

    @Indexed(unique = true)
    private String sku;
    @Indexed(unique = true, sparse = true)
    private String barcode;  // Optional; if null, SKU is used for scanning
    private String name;
    private String description;

    @Indexed
    private String categoryId;
    @Indexed
    private String supplierId;

    private BigDecimal unitPrice;

    @Builder.Default
    private Integer currentQuantity = 0;

    @Builder.Default
    private Integer reorderLevel = 5;

    private Integer safetyStock;
    private Integer leadTimeDays;
    @Indexed
    private String warehouseId;      // Optional; links to Warehouse
    private String warehouseLocation; // Fallback / display

    @Builder.Default
    private boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
