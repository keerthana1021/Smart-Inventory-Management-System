package com.example.demo.service;

import com.example.demo.dto.BulkStockUpdateRequest;
import com.example.demo.entity.InventoryTransaction;
import com.example.demo.entity.Product;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.InventoryTransactionRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BulkProductService {

    private final ProductRepository productRepository;
    private final ProductService productService;
    private final CategoryRepository categoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    /** Import products from CSV. Expected columns: sku,name,description,categoryId,supplierId,warehouseId,unitPrice,currentQuantity,reorderLevel,barcode */
    public BulkImportResult importFromCsv(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new BadRequestException("CSV file is required");
        var result = new BulkImportResult();
        try (var reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String header = reader.readLine();
            if (header == null) throw new BadRequestException("CSV is empty");
            String[] cols = header.split(",", -1);
            int idxSku = indexOf(cols, "sku", 0);
            int idxName = indexOf(cols, "name", 1);
            int idxDesc = indexOf(cols, "description", 2);
            int idxCat = indexOf(cols, "categoryId", 3);
            int idxSup = indexOf(cols, "supplierId", 4);
            int idxWh = indexOf(cols, "warehouseId", 5);
            int idxPrice = indexOf(cols, "unitPrice", 6);
            int idxQty = indexOf(cols, "currentQuantity", 7);
            int idxReorder = indexOf(cols, "reorderLevel", 8);
            int idxBarcode = indexOf(cols, "barcode", 9);

            String line;
            while ((line = reader.readLine()) != null) {
                result.totalRows++;
                String[] parts = line.split(",", -1);
                if (parts.length <= Math.max(idxSku, idxName)) continue;
                String sku = get(parts, idxSku);
                String name = get(parts, idxName);
                if (sku == null || sku.isBlank() || name == null || name.isBlank()) {
                    result.skipped++;
                    continue;
                }
                if (productRepository.existsBySku(sku.trim())) {
                    result.skipped++;
                    continue;
                }
                try {
                    var req = new com.example.demo.dto.ProductRequest();
                    req.setSku(sku.trim());
                    req.setName(name.trim());
                    req.setDescription(get(parts, idxDesc));
                    String catId = get(parts, idxCat);
                    if (catId == null || catId.isBlank()) {
                        var first = categoryRepository.findAll().iterator();
                        if (first.hasNext()) catId = first.next().getId();
                    }
                    if (catId == null || catId.isBlank()) { result.skipped++; continue; }
                    req.setCategoryId(catId.trim());
                    req.setSupplierId(blankToNull(get(parts, idxSup)));
                    req.setWarehouseId(blankToNull(get(parts, idxWh)));
                    req.setUnitPrice(parseDecimal(get(parts, idxPrice), BigDecimal.ZERO));
                    req.setCurrentQuantity(parseInt(get(parts, idxQty), 0));
                    req.setReorderLevel(parseInt(get(parts, idxReorder), 5));
                    req.setBarcode(blankToNull(get(parts, idxBarcode)));
                    productService.create(req);
                    result.imported++;
                } catch (Exception e) {
                    result.skipped++;
                }
            }
        } catch (Exception e) {
            throw new BadRequestException("CSV import failed: " + e.getMessage());
        }
        auditService.log("BULK_IMPORT", "Product", null, null, "imported=" + result.imported + " skipped=" + result.skipped);
        return result;
    }

    private static int indexOf(String[] cols, String name, int fallback) {
        for (int i = 0; i < cols.length; i++)
            if (name.equalsIgnoreCase(cols[i].trim())) return i;
        return fallback < cols.length ? fallback : 0;
    }

    private static String get(String[] parts, int idx) {
        if (idx < 0 || idx >= parts.length) return null;
        String s = parts[idx];
        return s != null ? s.trim() : null;
    }

    private static String blankToNull(String s) {
        return s != null && !s.isBlank() ? s : null;
    }

    private static BigDecimal parseDecimal(String s, BigDecimal def) {
        if (s == null || s.isBlank()) return def;
        try { return new BigDecimal(s.replaceAll("[^0-9.-]", "")); } catch (Exception e) { return def; }
    }

    private static int parseInt(String s, int def) {
        if (s == null || s.isBlank()) return def;
        try { return Integer.parseInt(s.replaceAll("[^0-9-]", "")); } catch (Exception e) { return def; }
    }

    public BulkStockUpdateResult bulkStockUpdate(BulkStockUpdateRequest request) {
        var result = new BulkStockUpdateResult();
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsername(username).orElse(null);
        String userId = user != null ? user.getId() : null;

        for (var item : request.getItems()) {
            if (item.getProductId() == null || item.getQuantity() == null) continue;
            try {
                Product p = productRepository.findById(item.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
                int current = p.getCurrentQuantity() != null ? p.getCurrentQuantity() : 0;
                int newQty = Math.max(0, current + item.getQuantity());
                p.setCurrentQuantity(newQty);
                p.setUpdatedAt(LocalDateTime.now());
                productRepository.save(p);

                var tx = InventoryTransaction.builder()
                        .productId(p.getId())
                        .transactionType(InventoryTransaction.TransactionType.ADJUSTMENT)
                        .quantity(item.getQuantity())
                        .quantityAfter(newQty)
                        .unitPrice(p.getUnitPrice())
                        .referenceType("BULK_UPDATE")
                        .performedById(userId)
                        .transactionDate(LocalDateTime.now())
                        .notes("Bulk stock update")
                        .build();
                transactionRepository.save(tx);
                result.updated++;
            } catch (Exception e) {
                result.failed++;
            }
        }
        auditService.log("BULK_STOCK_UPDATE", "Product", null, null, "updated=" + result.updated + " failed=" + result.failed);
        return result;
    }

    @lombok.Data
    public static class BulkImportResult {
        private int totalRows;
        private int imported;
        private int skipped;
    }

    @lombok.Data
    public static class BulkStockUpdateResult {
        private int updated;
        private int failed;
    }
}
