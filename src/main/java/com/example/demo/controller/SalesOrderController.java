package com.example.demo.controller;

import com.example.demo.dto.CreateSalesOrderRequest;
import com.example.demo.entity.SalesOrder;
import com.example.demo.service.SalesOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/sales-orders")
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<SalesOrder> create(@Valid @RequestBody CreateSalesOrderRequest request) {
        List<SalesOrderService.SalesOrderItemDto> items = request.getItems().stream()
                .map(i -> {
                    var dto = new SalesOrderService.SalesOrderItemDto();
                    dto.setProductId(i.getProductId());
                    dto.setQuantity(i.getQuantity());
                    dto.setUnitPrice(i.getUnitPrice());
                    return dto;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(salesOrderService.create(items, request.getCustomerName(), request.getCustomerEmail()));
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String search,
                                  @RequestParam(required = false) String productId,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(salesOrderService.findAll(search, productId, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public SalesOrder getById(@PathVariable String id) {
        return salesOrderService.getById(id);
    }

    /**
     * Two URL shapes: nested (legacy) and action-first (avoids some proxies / static-resource fallthrough).
     */
    @PostMapping({"/{id}/confirm", "/confirm/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<SalesOrder> confirm(@PathVariable String id) {
        return ResponseEntity.ok(salesOrderService.confirm(id));
    }

    @PostMapping({"/{id}/ship", "/ship/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<SalesOrder> markShipped(@PathVariable String id) {
        return ResponseEntity.ok(salesOrderService.markShipped(id));
    }

    @PostMapping({"/{id}/deliver", "/deliver/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<SalesOrder> markDelivered(@PathVariable String id) {
        return ResponseEntity.ok(salesOrderService.markDelivered(id));
    }
}
