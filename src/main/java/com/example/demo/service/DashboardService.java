package com.example.demo.service;

import com.example.demo.dto.DashboardOverviewDto;
import com.example.demo.dto.DashboardStats;
import com.example.demo.dto.ProductChartDto;
import com.example.demo.dto.ProductResponse;
import com.example.demo.entity.Category;
import com.example.demo.entity.Product;
import com.example.demo.entity.PurchaseOrder;
import com.example.demo.entity.SalesOrder;
import com.example.demo.entity.SalesOrderItem;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.PurchaseOrderRepository;
import com.example.demo.repository.SalesOrderRepository;
import com.example.demo.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.BasicQuery;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Dashboard metrics use indexed-friendly counts/aggregations instead of loading full collections
 * (critical when products count is 10k+).
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int LOW_STOCK_ALERT_LIMIT = 25;

    private static final List<SalesOrder.OrderStatus> REVENUE_STATUSES = List.of(
            SalesOrder.OrderStatus.CONFIRMED,
            SalesOrder.OrderStatus.SHIPPED,
            SalesOrder.OrderStatus.DELIVERED);

    /** Active products where currentQuantity &lt;= reorderLevel (matches ProductRepository low-stock query). */
    private static final String LOW_STOCK_JSON =
            "{ \"active\": true, \"$expr\": { \"$lte\": [\"$currentQuantity\", \"$reorderLevel\"] } }";

    private final ProductRepository productRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final CategoryRepository categoryRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final ProductService productService;
    private final MongoTemplate mongoTemplate;

    public DashboardOverviewDto getOverview(LocalDate from, LocalDate to) {
        DashboardStats stats = buildStats(from, to);
        ProductChartDto charts = buildProductCharts(stats.getLowStockCount(), from, to);
        return DashboardOverviewDto.builder().stats(stats).charts(charts).build();
    }

    public DashboardStats getStats() {
        return buildStats(null, null);
    }

    private DashboardStats buildStats(LocalDate from, LocalDate to) {
        long totalProducts = productRepository.count();
        long lowStockCount = mongoTemplate.count(new BasicQuery(LOW_STOCK_JSON), Product.class);
        BigDecimal totalRevenue = sumRevenueFromSalesOrders(from, to);
        long pendingOrders = purchaseOrderRepository.countByStatus(PurchaseOrder.OrderStatus.PENDING_APPROVAL);
        long activeSuppliers = supplierRepository.count();

        Query lowStockPageQuery = new BasicQuery(LOW_STOCK_JSON)
                .with(PageRequest.of(0, LOW_STOCK_ALERT_LIMIT, Sort.by(Sort.Direction.ASC, "currentQuantity")));
        List<Product> lowStockSlice = mongoTemplate.find(lowStockPageQuery, Product.class);
        List<ProductResponse> lowStockItems = productService.mapProductsToResponses(lowStockSlice);

        return DashboardStats.builder()
                .totalProducts(totalProducts)
                .lowStockCount(lowStockCount)
                .totalRevenue(totalRevenue)
                .pendingOrdersCount(pendingOrders)
                .activeSuppliersCount(activeSuppliers)
                .lowStockItems(lowStockItems)
                .build();
    }

    public ProductChartDto getProductCharts() {
        long lowStockCount = mongoTemplate.count(new BasicQuery(LOW_STOCK_JSON), Product.class);
        return buildProductCharts(lowStockCount, null, null);
    }

    private ProductChartDto buildProductCharts(long lowStockTotal, LocalDate from, LocalDate to) {
        // Bar chart = units sold per category (from sales order line items), not SKU inventory counts
        List<ProductChartDto.CategoryCount> salesByCategory = aggregateSalesUnitsByCategory(from, to);
        List<ProductChartDto.CategoryCount> productCountByCategory = aggregateActiveProductCountByCategory();
        long activeTotal = productRepository.countByActiveTrue();
        long countCritical = mongoTemplate.count(
                new Query(Criteria.where("active").is(true).and("currentQuantity").lte(0)),
                Product.class);
        long countLow = Math.max(0, lowStockTotal - countCritical);
        long countStocked = Math.max(0, activeTotal - lowStockTotal);
        List<ProductChartDto.StatusCount> statusBreakdown = List.of(
                new ProductChartDto.StatusCount("STOCKED", countStocked),
                new ProductChartDto.StatusCount("LOW", countLow),
                new ProductChartDto.StatusCount("CRITICAL", countCritical)
        );
        return ProductChartDto.builder()
                .productsByCategory(salesByCategory)
                .productCountByCategory(productCountByCategory)
                .stockStatusBreakdown(statusBreakdown)
                .build();
    }

    /**
     * Product (SKU) count per category for the dashboard chart.
     * No $match: same universe as {@link ProductRepository#count()} so the chart is never empty
     * when Total Products &gt; 0. Resolves {@code categoryId} to names via {@link CategoryRepository}.
     */
    private List<ProductChartDto.CategoryCount> aggregateActiveProductCountByCategory() {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.group("categoryId").count().as("count"));
        String collection = mongoTemplate.getCollectionName(Product.class);
        AggregationResults<Document> results =
                mongoTemplate.aggregate(aggregation, collection, Document.class);
        List<Document> rows = results.getMappedResults();
        if (rows.isEmpty()) {
            return List.of();
        }
        List<String> realCatIds = new ArrayList<>();
        for (Document doc : rows) {
            String cid = categoryIdFromGroupId(doc.get("_id"));
            if (cid != null && !cid.isBlank()) {
                realCatIds.add(cid);
            }
        }
        List<String> distinctIds = realCatIds.stream().distinct().toList();
        Map<String, String> idToName = distinctIds.isEmpty() ? Map.of() :
                StreamSupport.stream(categoryRepository.findAllById(distinctIds).spliterator(), false)
                        .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));

        List<ProductChartDto.CategoryCount> out = new ArrayList<>();
        for (Document doc : rows) {
            String cid = categoryIdFromGroupId(doc.get("_id"));
            Number cnt = (Number) doc.get("count");
            long n = cnt == null ? 0L : cnt.longValue();
            String name = (cid == null || cid.isBlank())
                    ? "Uncategorized"
                    : idToName.getOrDefault(cid, cid);
            out.add(new ProductChartDto.CategoryCount(name, n));
        }
        out.sort(Comparator.comparing(ProductChartDto.CategoryCount::getCategoryName, String.CASE_INSENSITIVE_ORDER));
        return out;
    }

    /** Value of $group._id when grouping by categoryId (null, String, or ObjectId in legacy data). */
    private static String categoryIdFromGroupId(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof ObjectId oid) {
            return oid.toHexString();
        }
        String s = raw.toString().trim();
        return s.isEmpty() ? null : s;
    }

    /**
     * Units sold per category, summed from CONFIRMED/SHIPPED/DELIVERED orders only.
     * Uses the same documents as the Sales Orders API (reliable with Spring Data mapping).
     */
    private List<ProductChartDto.CategoryCount> aggregateSalesUnitsByCategory(LocalDate from, LocalDate to) {
        List<SalesOrder> orders = loadRevenueOrders(from, to);
        if (orders.isEmpty()) {
            return List.of();
        }
        Set<String> productIds = new HashSet<>();
        for (SalesOrder o : orders) {
            if (o.getItems() == null) continue;
            for (SalesOrderItem it : o.getItems()) {
                if (it.getProductId() != null && !it.getProductId().isBlank()) {
                    productIds.add(it.getProductId());
                }
            }
        }
        if (productIds.isEmpty()) {
            return List.of();
        }
        Map<String, Product> productById = StreamSupport.stream(productRepository.findAllById(productIds).spliterator(), false)
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        Map<String, Long> unitsByCategoryId = new HashMap<>();
        for (SalesOrder o : orders) {
            if (o.getItems() == null) continue;
            for (SalesOrderItem it : o.getItems()) {
                if (it.getProductId() == null || it.getQuantity() == null || it.getQuantity() <= 0) continue;
                Product p = productById.get(it.getProductId());
                if (p == null) continue;
                String cid = p.getCategoryId() != null && !p.getCategoryId().isBlank() ? p.getCategoryId() : "_uncat";
                unitsByCategoryId.merge(cid, it.getQuantity().longValue(), Long::sum);
            }
        }
        if (unitsByCategoryId.isEmpty()) {
            return List.of();
        }
        List<String> realCatIds = unitsByCategoryId.keySet().stream()
                .filter(k -> !"_uncat".equals(k))
                .toList();
        Map<String, String> idToName = realCatIds.isEmpty() ? Map.of() :
                StreamSupport.stream(categoryRepository.findAllById(realCatIds).spliterator(), false)
                        .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));

        List<ProductChartDto.CategoryCount> out = new ArrayList<>();
        for (Map.Entry<String, Long> e : unitsByCategoryId.entrySet()) {
            String name = "_uncat".equals(e.getKey())
                    ? "Uncategorized"
                    : idToName.getOrDefault(e.getKey(), e.getKey());
            out.add(new ProductChartDto.CategoryCount(name, e.getValue()));
        }
        out.sort(Comparator.comparing(ProductChartDto.CategoryCount::getCategoryName, String.CASE_INSENSITIVE_ORDER));
        return out;
    }

    /**
     * Revenue = sum of {@code totalAmount} on sales orders. Uses {@link SalesOrderRepository}
     * so BSON → entity mapping matches the Sales Orders API (raw aggregation often returned ₹0).
     */
    private BigDecimal sumRevenueFromSalesOrders(LocalDate from, LocalDate to) {
        return loadRevenueOrders(from, to).stream()
                .map(SalesOrder::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<SalesOrder> loadRevenueOrders(LocalDate from, LocalDate to) {
        if (from != null && to != null) {
            LocalDateTime fromDt = from.atStartOfDay();
            LocalDateTime toDt = to.plusDays(1).atStartOfDay();
            return salesOrderRepository.findByStatusInAndCreatedAtBetween(REVENUE_STATUSES, fromDt, toDt);
        }
        return salesOrderRepository.findByStatusIn(REVENUE_STATUSES);
    }
}
