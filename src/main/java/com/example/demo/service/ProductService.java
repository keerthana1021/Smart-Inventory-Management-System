package com.example.demo.service;

import com.example.demo.dto.ProductRequest;
import com.example.demo.dto.ProductResponse;
import com.example.demo.entity.Product;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.SupplierRepository;
import com.example.demo.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final AuditService auditService;

    public ProductResponse create(ProductRequest dto) {
        if (productRepository.existsBySku(dto.getSku()))
            throw new BadRequestException("Product with SKU " + dto.getSku() + " already exists");
        categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (dto.getSupplierId() != null)
            supplierRepository.findById(dto.getSupplierId()).orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        if (dto.getWarehouseId() != null)
            warehouseRepository.findById(dto.getWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        var now = LocalDateTime.now();
        Product p = Product.builder()
                .sku(dto.getSku())
                .name(dto.getName())
                .description(dto.getDescription())
                .categoryId(dto.getCategoryId())
                .supplierId(dto.getSupplierId())
                .barcode(dto.getBarcode() != null && !dto.getBarcode().isBlank() ? dto.getBarcode() : null)
                .unitPrice(dto.getUnitPrice())
                .currentQuantity(dto.getCurrentQuantity() != null ? dto.getCurrentQuantity() : 0)
                .reorderLevel(dto.getReorderLevel() != null ? dto.getReorderLevel() : 5)
                .safetyStock(dto.getSafetyStock() != null ? dto.getSafetyStock() : 0)
                .leadTimeDays(dto.getLeadTimeDays() != null ? dto.getLeadTimeDays() : 7)
                .warehouseId(dto.getWarehouseId())
                .warehouseLocation(dto.getWarehouseLocation())
                .active(dto.isActive())
                .createdAt(now)
                .updatedAt(now)
                .build();
        p = productRepository.save(p);
        auditService.log("CREATE_PRODUCT", "Product", p.getId(), null, p.getSku());
        return toResponse(p);
    }

    public Page<ProductResponse> findAll(String search, String categoryId, String warehouseId, Pageable pageable) {
        if (warehouseId != null && !warehouseId.isBlank())
            return productRepository.findByWarehouseId(warehouseId, pageable).map(this::toResponse);
        if (categoryId != null && !categoryId.isBlank())
            return productRepository.findByCategoryId(categoryId, pageable).map(this::toResponse);
        if (search != null && !search.isBlank())
            return productRepository.findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(search, search, pageable)
                    .map(this::toResponse);
        return productRepository.findAll(pageable).map(this::toResponse);
    }

    public ProductResponse getById(String id) {
        return toResponse(productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found")));
    }

    /** Look up product by barcode or SKU (for scanning). */
    public ProductResponse scanByBarcodeOrSku(String code) {
        if (code == null || code.isBlank())
            throw new BadRequestException("Barcode/SKU is required");
        String trimmed = code.trim();
        // 1) Exact match by barcode
        var found = productRepository.findByBarcode(trimmed);
        if (found.isPresent()) return toResponse(found.get());
        // 2) Exact match by SKU
        found = productRepository.findBySku(trimmed);
        if (found.isPresent()) return toResponse(found.get());
        // 3) Fallback: search by SKU/name containing (handles partial input, case differences)
        var page = productRepository.findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(trimmed, trimmed, org.springframework.data.domain.PageRequest.of(0, 2));
        if (page.getTotalElements() == 1)
            return toResponse(page.getContent().get(0));
        if (page.getTotalElements() > 1)
            throw new BadRequestException("Multiple products match \"" + trimmed + "\". Please use the exact SKU.");
        throw new ResourceNotFoundException("No product found for barcode/SKU: " + trimmed);
    }

    public ProductResponse update(String id, ProductRequest dto) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        String oldVal = p.getSku() + "|" + p.getName();
        categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (dto.getSupplierId() != null)
            supplierRepository.findById(dto.getSupplierId()).orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        if (dto.getWarehouseId() != null)
            warehouseRepository.findById(dto.getWarehouseId()).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        p.setName(dto.getName());
        p.setDescription(dto.getDescription());
        p.setCategoryId(dto.getCategoryId());
        p.setBarcode(dto.getBarcode() != null && !dto.getBarcode().isBlank() ? dto.getBarcode() : null);
        p.setSupplierId(dto.getSupplierId());
        p.setUnitPrice(dto.getUnitPrice());
        if (dto.getCurrentQuantity() != null)
            p.setCurrentQuantity(dto.getCurrentQuantity());
        p.setReorderLevel(dto.getReorderLevel());
        p.setSafetyStock(dto.getSafetyStock());
        p.setLeadTimeDays(dto.getLeadTimeDays());
        p.setWarehouseId(dto.getWarehouseId());
        p.setWarehouseLocation(dto.getWarehouseLocation());
        p.setActive(dto.isActive());
        p.setUpdatedAt(LocalDateTime.now());
        p = productRepository.save(p);
        auditService.log("UPDATE_PRODUCT", "Product", p.getId(), oldVal, p.getSku() + "|" + p.getName());
        return toResponse(p);
    }

    public List<ProductResponse> getLowStock() {
        return productRepository.findLowStockProducts().stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Batch mapping for dashboard / exports — loads categories, suppliers, warehouses in bulk
     * instead of one lookup per product.
     */
    public List<ProductResponse> mapProductsToResponses(List<Product> products) {
        if (products == null || products.isEmpty()) return List.of();
        Set<String> catIds = new HashSet<>();
        Set<String> supIds = new HashSet<>();
        Set<String> whIds = new HashSet<>();
        for (Product p : products) {
            if (p.getCategoryId() != null && !p.getCategoryId().isBlank()) catIds.add(p.getCategoryId());
            if (p.getSupplierId() != null && !p.getSupplierId().isBlank()) supIds.add(p.getSupplierId());
            if (p.getWarehouseId() != null && !p.getWarehouseId().isBlank()) whIds.add(p.getWarehouseId());
        }
        Map<String, String> catNames = StreamSupport.stream(categoryRepository.findAllById(catIds).spliterator(), false)
                .collect(Collectors.toMap(com.example.demo.entity.Category::getId, com.example.demo.entity.Category::getName));
        Map<String, String> supNames = StreamSupport.stream(supplierRepository.findAllById(supIds).spliterator(), false)
                .collect(Collectors.toMap(com.example.demo.entity.Supplier::getId, com.example.demo.entity.Supplier::getName));
        Map<String, String> whNames = StreamSupport.stream(warehouseRepository.findAllById(whIds).spliterator(), false)
                .collect(Collectors.toMap(com.example.demo.entity.Warehouse::getId, com.example.demo.entity.Warehouse::getName));
        return products.stream().map(p -> toResponseWithMaps(p, catNames, supNames, whNames)).collect(Collectors.toList());
    }

    private ProductResponse toResponseWithMaps(Product p, Map<String, String> catNames, Map<String, String> supNames, Map<String, String> whNames) {
        ProductResponse r = new ProductResponse();
        r.setId(p.getId());
        r.setSku(p.getSku());
        r.setName(p.getName());
        r.setDescription(p.getDescription());
        r.setBarcode(p.getBarcode());
        r.setCategoryId(p.getCategoryId());
        r.setCategoryName(p.getCategoryId() != null ? catNames.get(p.getCategoryId()) : null);
        if (p.getSupplierId() != null) {
            r.setSupplierId(p.getSupplierId());
            r.setSupplierName(supNames.get(p.getSupplierId()));
        }
        r.setUnitPrice(p.getUnitPrice());
        r.setCurrentQuantity(p.getCurrentQuantity());
        r.setReorderLevel(p.getReorderLevel());
        r.setStockStatus(stockStatus(p));
        r.setWarehouseId(p.getWarehouseId());
        r.setWarehouseName(p.getWarehouseId() != null ? whNames.get(p.getWarehouseId()) : null);
        r.setWarehouseLocation(p.getWarehouseLocation());
        r.setActive(p.isActive());
        r.setCreatedAt(p.getCreatedAt());
        return r;
    }

    public List<ProductResponse> findAllForExport() {
        List<Product> products = productRepository.findAll();
        return mapProductsToResponses(products);
    }

    private String stockStatus(Product p) {
        if (p.getCurrentQuantity() <= 0) return "CRITICAL";
        if (p.getCurrentQuantity() <= p.getReorderLevel()) return "LOW";
        return "STOCKED";
    }

    private ProductResponse toResponse(Product p) {
        ProductResponse r = new ProductResponse();
        r.setId(p.getId());
        r.setSku(p.getSku());
        r.setName(p.getName());
        r.setDescription(p.getDescription());
        r.setBarcode(p.getBarcode());
        r.setCategoryId(p.getCategoryId());
        r.setCategoryName(categoryRepository.findById(p.getCategoryId()).map(com.example.demo.entity.Category::getName).orElse(null));
        if (p.getSupplierId() != null) {
            r.setSupplierId(p.getSupplierId());
            r.setSupplierName(supplierRepository.findById(p.getSupplierId()).map(com.example.demo.entity.Supplier::getName).orElse(null));
        }
        r.setUnitPrice(p.getUnitPrice());
        r.setCurrentQuantity(p.getCurrentQuantity());
        r.setReorderLevel(p.getReorderLevel());
        r.setStockStatus(stockStatus(p));
        r.setWarehouseId(p.getWarehouseId());
        r.setWarehouseName(p.getWarehouseId() != null ? warehouseRepository.findById(p.getWarehouseId()).map(com.example.demo.entity.Warehouse::getName).orElse(null) : null);
        r.setWarehouseLocation(p.getWarehouseLocation());
        r.setActive(p.isActive());
        r.setCreatedAt(p.getCreatedAt());
        return r;
    }
}
