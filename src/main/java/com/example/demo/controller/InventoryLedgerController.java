package com.example.demo.controller;

import com.example.demo.dto.StockAdjustmentRequest;
import com.example.demo.entity.InventoryTransaction;
import com.example.demo.entity.Product;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.InventoryTransactionRepository;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@RestController
@RequestMapping("/api/v1/ledger")
@RequiredArgsConstructor
public class InventoryLedgerController {

    private final InventoryTransactionRepository transactionRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String productId,
                                  @RequestParam(required = false) InventoryTransaction.TransactionType transactionType,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "transactionDate"));
        Page<InventoryTransaction> result;
        if (productId != null && transactionType != null)
            result = transactionRepository.findByProductIdAndTransactionType(productId, transactionType, pageable);
        else if (productId != null)
            result = transactionRepository.findByProductId(productId, pageable);
        else if (transactionType != null)
            result = transactionRepository.findByTransactionType(transactionType, pageable);
        else
            result = transactionRepository.findAll(pageable);

        var productIds = result.getContent().stream()
                .map(InventoryTransaction::getProductId)
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();
        Map<String, String> skuByProductId = productIds.isEmpty() ? Map.of() :
                StreamSupport.stream(productRepository.findAllById(productIds).spliterator(), false)
                        .collect(Collectors.toMap(p -> p.getId(), p -> p.getSku(), (a, b) -> a));

        List<LedgerEntryDto> entries = result.getContent().stream()
                .map(tx -> LedgerEntryDto.from(tx, skuByProductId.get(tx.getProductId())))
                .toList();
        return ResponseEntity.ok(Map.of(
                "content", entries,
                "page", result.getNumber(),
                "size", result.getSize(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "first", result.isFirst(),
                "last", result.isLast()
        ));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<LedgerEntryDto> adjust(@Valid @RequestBody StockAdjustmentRequest request) {
        if (request.getQuantity() == null || request.getQuantity() == 0)
            throw new BadRequestException("Quantity must be non-zero (positive to add, negative to subtract)");
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        int currentQty = product.getCurrentQuantity() != null ? product.getCurrentQuantity() : 0;
        int newQty = currentQty + request.getQuantity();
        if (newQty < 0)
            throw new BadRequestException("Adjustment would result in negative stock. Current: " + currentQty + ", adjustment: " + request.getQuantity());
        product.setCurrentQuantity(newQty);
        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByUsername(username).orElse(null);
        String userId = user != null ? user.getId() : null;

        var tx = InventoryTransaction.builder()
                .productId(product.getId())
                .transactionType(InventoryTransaction.TransactionType.ADJUSTMENT)
                .quantity(request.getQuantity())
                .quantityAfter(newQty)
                .unitPrice(product.getUnitPrice())
                .referenceType("MANUAL_ADJUSTMENT")
                .referenceId(null)
                .performedById(userId)
                .transactionDate(LocalDateTime.now())
                .notes(request.getNotes() != null ? request.getNotes() : "Manual stock adjustment")
                .build();
        tx = transactionRepository.save(tx);
        auditService.log("STOCK_ADJUSTMENT", "Product", product.getId(), String.valueOf(currentQty), String.valueOf(newQty));
        LedgerEntryDto dto = LedgerEntryDto.from(tx, product.getSku());
        return ResponseEntity.ok(dto);
    }

    @lombok.Data
    @lombok.Builder
    public static class LedgerEntryDto {
        private String id;
        private String productId;
        private String productSku;
        private InventoryTransaction.TransactionType transactionType;
        private Integer quantity;
        private Integer quantityAfter;
        private java.math.BigDecimal unitPrice;
        private String referenceType;
        private String referenceId;
        private java.time.LocalDateTime transactionDate;
        private String notes;

        static LedgerEntryDto from(InventoryTransaction tx, String productSku) {
            return LedgerEntryDto.builder()
                    .id(tx.getId())
                    .productId(tx.getProductId())
                    .productSku(productSku)
                    .transactionType(tx.getTransactionType())
                    .quantity(tx.getQuantity())
                    .quantityAfter(tx.getQuantityAfter())
                    .unitPrice(tx.getUnitPrice())
                    .referenceType(tx.getReferenceType())
                    .referenceId(tx.getReferenceId())
                    .transactionDate(tx.getTransactionDate())
                    .notes(tx.getNotes())
                    .build();
        }
    }
}
