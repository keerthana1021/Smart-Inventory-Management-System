package com.example.demo.service;

import com.example.demo.dto.ProductRequest;
import com.example.demo.entity.Category;
import com.example.demo.entity.Supplier;
import com.example.demo.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

/**
 * Seeds the database from retail_store_inventory.csv.
 * Creates: Categories, Suppliers (by Region), and one Product per CSV row (up to MAX_PRODUCTS).
 * Each row gets a unique SKU (productId-storeId-rowIndex) so we reach 10k–15k products.
 * Prices converted to INR (CSV assumed USD × 83). Phone numbers use Indian format.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CsvSeedService {

    private static final double USD_TO_INR = 83.0;
    private static final int DEFAULT_REORDER_LEVEL = 10;
    /** Max products to create from CSV rows (one per row) to get 10k–15k entries. */
    private static final int MAX_PRODUCTS = 15_000;

    private final CategoryService categoryService;
    private final SupplierService supplierService;
    private final ProductService productService;

    /**
     * Load from file path (project root or absolute). Default filename: retail_store_inventory.csv
     */
    public CsvSeedResult loadFromCsv(String filename) throws IOException {
        if (filename == null || filename.isBlank()) {
            filename = "retail_store_inventory.csv";
        }
        Path path = Path.of(filename);
        if (!Files.exists(path)) {
            Path projectRoot = Path.of(System.getProperty("user.dir"));
            path = projectRoot.resolve(filename);
        }
        if (!Files.exists(path)) {
            throw new BadRequestException("CSV file not found: " + filename + " (tried current dir and project root: " + System.getProperty("user.dir") + ")");
        }
        return loadFromCsvPath(path);
    }

    public CsvSeedResult loadFromCsvPath(Path path) throws IOException {
        List<String> lines = Files.readAllLines(path);
        if (lines.size() < 2) {
            throw new BadRequestException("CSV file is empty or has no data rows.");
        }
        String header = lines.get(0);
        // Columns: Date,Store ID,Product ID,Category,Region,Inventory Level,Units Sold,Units Ordered,Demand Forecast,Price,Discount,...
        int idxDate = 0, idxStore = 1, idxProductId = 2, idxCategory = 3, idxRegion = 4, idxInventory = 5, idxPrice = 9;
        String[] headers = header.split(",");
        for (int i = 0; i < headers.length; i++) {
            String h = headers[i].trim();
            if ("Store ID".equals(h)) idxStore = i;
            else if ("Product ID".equals(h)) idxProductId = i;
            else if ("Category".equals(h)) idxCategory = i;
            else if ("Region".equals(h)) idxRegion = i;
            else if ("Inventory Level".equals(h)) idxInventory = i;
            else if ("Price".equals(h)) idxPrice = i;
        }

        Set<String> categoryNames = new LinkedHashSet<>();
        Set<String> regionNames = new LinkedHashSet<>();
        // One product per row (up to MAX_PRODUCTS) so we get 10k–15k entries
        List<CsvProductRow> productRows = new ArrayList<>();

        for (int i = 1; i < lines.size() && productRows.size() < MAX_PRODUCTS; i++) {
            String line = lines.get(i);
            String[] cols = line.split(",", -1);
            if (cols.length <= Math.max(idxCategory, Math.max(idxInventory, idxPrice))) continue;
            String storeId = safe(cols, idxStore);
            String productId = safe(cols, idxProductId);
            String category = safe(cols, idxCategory);
            String region = safe(cols, idxRegion);
            if (productId.isBlank() || category.isBlank() || storeId.isBlank()) continue;
            categoryNames.add(category);
            if (!region.isBlank()) regionNames.add(region);
            int inventory = parseInt(safe(cols, idxInventory), 0);
            double price = parseDouble(safe(cols, idxPrice), 0.0);
            productRows.add(new CsvProductRow(storeId, productId, category, region, inventory, price, i));
        }

        // 1) Create categories
        Map<String, String> categoryIdByName = new HashMap<>();
        int categoriesCreated = 0;
        for (String name : categoryNames) {
            Category c = categoryService.create(name, name + " category");
            categoryIdByName.put(name, c.getId());
            categoriesCreated++;
        }

        // 2) Create suppliers by region (Indian-style names and phones)
        Map<String, String> supplierIdByRegion = new HashMap<>();
        int suppliersCreated = 0;
        long phoneSuffix = 9876543210L;
        for (String region : regionNames) {
            Supplier s = supplierService.findByNameOrCreate(
                    "Supplier " + region,
                    "contact+" + region.toLowerCase() + "@retail.in",
                    "+91-" + (phoneSuffix++),
                    region + " Region"
            );
            supplierIdByRegion.put(region, s.getId());
        }
        if (supplierIdByRegion.isEmpty()) {
            Supplier def = supplierService.findByNameOrCreate("Retail Supplier", "retail@example.com", "+91-9876543210", "India");
            supplierIdByRegion.put("", def.getId());
        }
        suppliersCreated = supplierIdByRegion.size();

        // 3) Create one product per row (unique SKU per row so we get 10k–15k products)
        int productsCreated = 0, productsSkipped = 0;
        for (CsvProductRow row : productRows) {
            String categoryId = categoryIdByName.get(row.category);
            String supplierId = row.region != null && supplierIdByRegion.containsKey(row.region)
                    ? supplierIdByRegion.get(row.region)
                    : supplierIdByRegion.values().iterator().next();
            if (categoryId == null) continue;
            ProductRequest req = new ProductRequest();
            // Unique SKU per row: P0001-S001-R12345 so every row becomes a product
            String uniqueSku = row.productId + "-" + row.storeId + "-R" + row.rowIndex;
            req.setSku(uniqueSku);
            req.setName(row.category + " - " + row.productId + " - " + row.storeId);
            req.setDescription("From retail store inventory (row " + row.rowIndex + ")");
            req.setCategoryId(categoryId);
            req.setSupplierId(supplierId);
            req.setUnitPrice(priceToInr(row.price));
            req.setCurrentQuantity(Math.max(0, row.inventoryLevel));
            req.setReorderLevel(DEFAULT_REORDER_LEVEL);
            req.setActive(true);
            try {
                productService.create(req);
                productsCreated++;
            } catch (BadRequestException e) {
                if (e.getMessage() != null && e.getMessage().contains("already exists")) {
                    productsSkipped++;
                } else {
                    throw e;
                }
            }
        }

        return new CsvSeedResult(categoriesCreated, suppliersCreated, productsCreated, productsSkipped,
                categoryNames.size(), regionNames.size(), productRows.size());
    }

    private static String safe(String[] cols, int i) {
        return i < cols.length ? cols[i].trim() : "";
    }

    private static int parseInt(String s, int def) {
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            return def;
        }
    }

    private static double parseDouble(String s, double def) {
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            return def;
        }
    }

    private static BigDecimal priceToInr(double usdPrice) {
        return BigDecimal.valueOf(usdPrice * USD_TO_INR).setScale(2, RoundingMode.HALF_UP);
    }

    private static class CsvProductRow {
        final String storeId;
        final String productId;
        final String category;
        final String region;
        final int inventoryLevel;
        final double price;
        final int rowIndex;

        CsvProductRow(String storeId, String productId, String category, String region, int inventoryLevel, double price, int rowIndex) {
            this.storeId = storeId;
            this.productId = productId;
            this.category = category;
            this.region = region;
            this.inventoryLevel = inventoryLevel;
            this.price = price;
            this.rowIndex = rowIndex;
        }
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class CsvSeedResult {
        private int categoriesCreated;
        private int suppliersCreated;
        private int productsCreated;
        private int productsSkipped;
        private int categoriesTotal;
        private int regionsTotal;
        private int productsTotal;
    }
}
