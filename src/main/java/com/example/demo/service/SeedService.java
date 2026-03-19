package com.example.demo.service;

import com.example.demo.dto.ProductRequest;
import com.example.demo.entity.Category;
import com.example.demo.entity.Supplier;
import com.example.demo.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeedService {

    private final CategoryService categoryService;
    private final SupplierService supplierService;
    private final ProductService productService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SeedResult loadSeedData() {
        ClassPathResource resource = new ClassPathResource("seed-data.json");
        if (!resource.exists()) {
            throw new BadRequestException("seed-data.json not found in classpath.");
        }
        try {
            JsonNode root = objectMapper.readTree(resource.getInputStream());
            List<String> categoryIds = new ArrayList<>();
            List<String> supplierIds = new ArrayList<>();
            int categoriesCreated = 0, suppliersCreated = 0, productsCreated = 0, productsSkipped = 0;

            for (JsonNode cat : root.get("categories")) {
                Category c = categoryService.create(
                        cat.get("name").asText(),
                        cat.has("description") ? cat.get("description").asText() : null
                );
                categoryIds.add(c.getId());
                categoriesCreated++;
            }

            long supplierCountBefore = supplierService.count();
            for (JsonNode sup : root.get("suppliers")) {
                Supplier s = supplierService.findByNameOrCreate(
                        sup.get("name").asText(),
                        sup.has("email") ? sup.get("email").asText() : null,
                        sup.has("phone") ? sup.get("phone").asText() : null,
                        sup.has("address") ? sup.get("address").asText() : null
                );
                supplierIds.add(s.getId());
            }
            suppliersCreated = (int) (supplierService.count() - supplierCountBefore);

            for (JsonNode prod : root.get("products")) {
                int catIdx = prod.get("categoryIndex").asInt();
                int supIdx = prod.get("supplierIndex").asInt();
                if (catIdx >= categoryIds.size() || supIdx >= supplierIds.size()) continue;
                ProductRequest req = new ProductRequest();
                req.setSku(prod.get("sku").asText());
                req.setName(prod.get("name").asText());
                req.setDescription(prod.has("description") ? prod.get("description").asText() : null);
                req.setCategoryId(categoryIds.get(catIdx));
                req.setSupplierId(supplierIds.get(supIdx));
                req.setUnitPrice(BigDecimal.valueOf(prod.get("unitPrice").asDouble()));
                req.setCurrentQuantity(prod.has("currentQuantity") ? prod.get("currentQuantity").asInt() : 0);
                req.setReorderLevel(prod.has("reorderLevel") ? prod.get("reorderLevel").asInt() : 5);
                req.setWarehouseLocation(prod.has("warehouseLocation") ? prod.get("warehouseLocation").asText() : null);
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

            return new SeedResult(categoriesCreated, suppliersCreated, productsCreated, productsSkipped);
        } catch (Exception e) {
            log.error("Seed load failed", e);
            throw new BadRequestException("Seed load failed: " + e.getMessage());
        }
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class SeedResult {
        private int categoriesCreated;
        private int suppliersCreated;
        private int productsCreated;
        private int productsSkipped;
    }
}
