package com.example.demo.service;

import com.example.demo.entity.Warehouse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public Warehouse create(Warehouse w) {
        var now = LocalDateTime.now();
        w.setCreatedAt(now);
        w.setUpdatedAt(now);
        return warehouseRepository.save(w);
    }

    public Page<Warehouse> findAll(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            String s = search.trim();
            return warehouseRepository.findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(s, s, pageable);
        }
        return warehouseRepository.findAll(pageable);
    }

    public Warehouse getById(String id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
    }

    public Warehouse update(String id, Warehouse w) {
        Warehouse existing = getById(id);
        if (w.getName() != null) existing.setName(w.getName());
        if (w.getCode() != null) existing.setCode(w.getCode());
        if (w.getAddress() != null) existing.setAddress(w.getAddress());
        existing.setUpdatedAt(LocalDateTime.now());
        return warehouseRepository.save(existing);
    }
}
