package com.example.demo.controller;

import com.example.demo.entity.Warehouse;
import com.example.demo.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String search,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(warehouseService.findAll(search, PageRequest.of(page, size)));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Warehouse>> listAll() {
        return ResponseEntity.ok(warehouseService.findAll(null, PageRequest.of(0, 200)).getContent());
    }

    @GetMapping("/{id}")
    public Warehouse getById(@PathVariable String id) {
        return warehouseService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Warehouse> create(@RequestBody Warehouse warehouse) {
        return ResponseEntity.ok(warehouseService.create(warehouse));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Warehouse update(@PathVariable String id, @RequestBody Warehouse warehouse) {
        return warehouseService.update(id, warehouse);
    }
}
