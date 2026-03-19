package com.example.demo.controller;

import com.example.demo.dto.CreatePurchaseOrderRequest;
import com.example.demo.dto.PageResponse;
import com.example.demo.dto.PurchaseOrderListDto;
import com.example.demo.entity.PurchaseOrder;
import com.example.demo.service.PurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<PurchaseOrder> create(@Valid @RequestBody CreatePurchaseOrderRequest request) {
        List<PurchaseOrderService.PurchaseOrderItemDto> items = request.getItems().stream()
                .map(i -> {
                    var dto = new PurchaseOrderService.PurchaseOrderItemDto();
                    dto.setProductId(i.getProductId());
                    dto.setQuantity(i.getQuantity());
                    dto.setUnitPrice(i.getUnitPrice());
                    return dto;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(purchaseOrderService.create(request.getSupplierId(), items));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<PurchaseOrder> approve(@PathVariable String id) {
        return ResponseEntity.ok(purchaseOrderService.approve(id));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<PurchaseOrder> receive(@PathVariable String id) {
        return ResponseEntity.ok(purchaseOrderService.receive(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<PurchaseOrder> reject(@PathVariable String id) {
        return ResponseEntity.ok(purchaseOrderService.reject(id));
    }

    @GetMapping
    public ResponseEntity<PageResponse<PurchaseOrderListDto>> list(@RequestParam(required = false) String search,
                                                                   @RequestParam(required = false) PurchaseOrder.OrderStatus status,
                                                                   @RequestParam(required = false) String productId,
                                                                   @RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(defaultValue = "20") int size) {
        var result = purchaseOrderService.findAllDtos(search, status, productId, PageRequest.of(page, size));
        return ResponseEntity.ok(new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isFirst(), result.isLast()));
    }

    @GetMapping("/{id}")
    public com.example.demo.dto.PurchaseOrderDetailDto getById(@PathVariable String id) {
        return purchaseOrderService.getDetailById(id);
    }
}
