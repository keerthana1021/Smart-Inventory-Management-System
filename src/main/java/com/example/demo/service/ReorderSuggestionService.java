package com.example.demo.service;

import com.example.demo.dto.ReorderSuggestionDto;
import com.example.demo.entity.Category;
import com.example.demo.entity.Product;
import com.example.demo.entity.Supplier;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
public class ReorderSuggestionService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    /** Products where currentQuantity <= reorderLevel. Suggested order qty = reorderLevel + (safetyStock or 5) - currentQuantity */
    public List<ReorderSuggestionDto> getSuggestions() {
        List<Product> products = productRepository.findLowStockProducts();
        var catIds = products.stream().map(Product::getCategoryId).filter(id -> id != null && !id.isBlank()).distinct().toList();
        var supIds = products.stream().map(Product::getSupplierId).filter(id -> id != null && !id.isBlank()).distinct().toList();
        Map<String, String> catNames = catIds.isEmpty() ? Map.of() :
                StreamSupport.stream(categoryRepository.findAllById(catIds).spliterator(), false)
                        .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));
        Map<String, String> supNames = supIds.isEmpty() ? Map.of() :
                StreamSupport.stream(supplierRepository.findAllById(supIds).spliterator(), false)
                        .collect(Collectors.toMap(Supplier::getId, Supplier::getName, (a, b) -> a));

        return products.stream().map(p -> {
            int current = p.getCurrentQuantity() != null ? p.getCurrentQuantity() : 0;
            int reorder = p.getReorderLevel() != null ? p.getReorderLevel() : 5;
            int safety = p.getSafetyStock() != null ? p.getSafetyStock() : 5;
            int suggested = Math.max(reorder + safety - current, reorder);
            return ReorderSuggestionDto.builder()
                    .productId(p.getId())
                    .sku(p.getSku())
                    .name(p.getName())
                    .currentQuantity(current)
                    .reorderLevel(reorder)
                    .leadTimeDays(p.getLeadTimeDays())
                    .suggestedOrderQty(suggested)
                    .unitPrice(p.getUnitPrice())
                    .categoryName(p.getCategoryId() != null ? catNames.get(p.getCategoryId()) : null)
                    .supplierName(p.getSupplierId() != null ? supNames.get(p.getSupplierId()) : null)
                    .build();
        }).collect(Collectors.toList());
    }
}
