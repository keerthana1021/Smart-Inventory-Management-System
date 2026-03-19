package com.example.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkStockUpdateRequest {
    @NotEmpty
    @Valid
    private List<StockUpdateItem> items;

    @Data
    public static class StockUpdateItem {
        private String productId;
        private Integer quantity;  // new absolute quantity, or delta (depends on API design - we'll use delta)
    }
}
