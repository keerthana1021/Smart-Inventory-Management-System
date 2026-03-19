package com.example.demo.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "inventory_transactions")
@CompoundIndexes({
        @CompoundIndex(name = "idx_tx_product_date", def = "{'productId':1,'transactionDate':-1}"),
        @CompoundIndex(name = "idx_tx_type_date", def = "{'transactionType':1,'transactionDate':-1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransaction {

    @Id
    private String id;

    @Indexed
    private String productId;
    private TransactionType transactionType;
    private Integer quantity;
    private Integer quantityAfter;
    private BigDecimal unitPrice;
    private String referenceType;
    private String referenceId;
    private String performedById;
    @Indexed
    private LocalDateTime transactionDate;
    private String notes;

    public enum TransactionType {
        IN, OUT, RETURN, ADJUSTMENT, DAMAGE, TRANSFER
    }
}
