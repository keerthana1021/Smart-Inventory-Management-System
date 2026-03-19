package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportsDto {
    private BigDecimal totalRevenue;
    private long orderCount;
    private List<RevenueByDate> revenueByDate;
    private List<SalesByCategory> salesByCategory;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueByDate {
        private String date;
        private BigDecimal revenue;
        private long orderCount;
        /** Revenue per category for stacked chart: categoryName -> amount */
        private java.util.Map<String, BigDecimal> byCategory;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesByCategory {
        private String categoryName;
        private long quantitySold;
        private BigDecimal revenue;
    }
}
