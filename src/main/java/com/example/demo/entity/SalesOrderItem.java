package com.example.demo.entity;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrderItem {

    private String productId;
    private Integer quantity;
    private BigDecimal unitPrice;

    public BigDecimal getLineTotal() {
        return unitPrice != null && quantity != null ? unitPrice.multiply(BigDecimal.valueOf(quantity)) : BigDecimal.ZERO;
    }
}
