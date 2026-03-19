package com.example.demo.service;

import com.example.demo.dto.ReportsDto;
import com.example.demo.entity.SalesOrder;
import com.example.demo.entity.SalesOrderItem;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.SalesOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportsService {

    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    private static final List<SalesOrder.OrderStatus> REVENUE_STATUSES = List.of(
            SalesOrder.OrderStatus.CONFIRMED,
            SalesOrder.OrderStatus.SHIPPED,
            SalesOrder.OrderStatus.DELIVERED
    );

    public ReportsDto getReports(LocalDate from, LocalDate to) {
        LocalDateTime fromDt = from != null ? from.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime toDt = to != null ? to.plusDays(1).atStartOfDay() : LocalDateTime.now().plusYears(1);

        List<SalesOrder> orders = salesOrderRepository.findByStatusInAndCreatedAtBetween(REVENUE_STATUSES, fromDt, toDt);

        BigDecimal totalRevenue = orders.stream()
                .map(SalesOrder::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, RevenueByDate> revenueByDateMap = new LinkedHashMap<>();
        Map<String, SalesByCategory> salesByCategoryMap = new HashMap<>();

        for (SalesOrder order : orders) {
            String dateStr = order.getCreatedAt() != null
                    ? order.getCreatedAt().toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE)
                    : "unknown";
            revenueByDateMap.computeIfAbsent(dateStr, k -> new RevenueByDate(dateStr, BigDecimal.ZERO, 0, new HashMap<>()));
            RevenueByDate rbd = revenueByDateMap.get(dateStr);
            rbd.revenue = rbd.revenue.add(order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
            rbd.orderCount++;

            for (var item : order.getItems() != null ? order.getItems() : List.<SalesOrderItem>of()) {
                if (item.getProductId() != null) {
                    productRepository.findById(item.getProductId()).ifPresent(p -> {
                        String catName = p.getCategoryId() != null
                                ? categoryRepository.findById(p.getCategoryId()).map(c -> c.getName()).orElse("Uncategorized")
                                : "Uncategorized";
                        salesByCategoryMap.computeIfAbsent(catName, k -> new SalesByCategory(catName, 0, BigDecimal.ZERO));
                        SalesByCategory sbc = salesByCategoryMap.get(catName);
                        sbc.quantitySold += item.getQuantity() != null ? item.getQuantity() : 0;
                        sbc.revenue = sbc.revenue.add(item.getLineTotal() != null ? item.getLineTotal() : BigDecimal.ZERO);
                        // Track revenue by date and category for stacked chart
                        rbd.byCategory.merge(catName, item.getLineTotal() != null ? item.getLineTotal() : BigDecimal.ZERO, BigDecimal::add);
                    });
                }
            }
        }

        List<ReportsDto.RevenueByDate> revenueByDate = revenueByDateMap.values().stream()
                .sorted(Comparator.comparing(r -> r.date))
                .map(r -> new ReportsDto.RevenueByDate(r.date, r.revenue, r.orderCount, r.byCategory))
                .collect(Collectors.toList());

        List<ReportsDto.SalesByCategory> salesByCategory = salesByCategoryMap.values().stream()
                .map(s -> new ReportsDto.SalesByCategory(s.categoryName, s.quantitySold, s.revenue))
                .collect(Collectors.toList());

        return ReportsDto.builder()
                .totalRevenue(totalRevenue)
                .orderCount(orders.size())
                .revenueByDate(revenueByDate)
                .salesByCategory(salesByCategory)
                .build();
    }

    private static class RevenueByDate {
        String date;
        BigDecimal revenue;
        long orderCount;
        Map<String, BigDecimal> byCategory;
        RevenueByDate(String date, BigDecimal revenue, long orderCount, Map<String, BigDecimal> byCategory) {
            this.date = date;
            this.revenue = revenue;
            this.orderCount = orderCount;
            this.byCategory = byCategory;
        }
    }

    private static class SalesByCategory {
        String categoryName;
        long quantitySold;
        BigDecimal revenue;
        SalesByCategory(String categoryName, long quantitySold, BigDecimal revenue) {
            this.categoryName = categoryName;
            this.quantitySold = quantitySold;
            this.revenue = revenue;
        }
    }
}
