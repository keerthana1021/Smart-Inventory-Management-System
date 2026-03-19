package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductChartDto {
    /** Units sold per category (CONFIRMED / SHIPPED / DELIVERED orders). */
    private List<CategoryCount> productsByCategory;
    /** Active SKU count per category (inventory catalog). */
    private List<CategoryCount> productCountByCategory;
    private List<StatusCount> stockStatusBreakdown;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryCount {
        private String categoryName;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusCount {
        private String status;
        private long count;
    }
}
