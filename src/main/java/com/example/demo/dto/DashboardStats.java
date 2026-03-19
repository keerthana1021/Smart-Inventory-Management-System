package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalProducts;
    private long lowStockCount;
    private BigDecimal totalRevenue;
    private long pendingOrdersCount;
    private long activeSuppliersCount;
    private List<ProductResponse> lowStockItems;
}
