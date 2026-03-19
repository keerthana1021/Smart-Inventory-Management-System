package com.example.demo.service;

import com.example.demo.entity.Supplier;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public Supplier create(Supplier s) {
        var now = LocalDateTime.now();
        s.setCreatedAt(now);
        s.setUpdatedAt(now);
        return supplierRepository.save(s);
    }

    /** Find supplier by name or create new. Used by seed to avoid duplicates. */
    public Supplier findByNameOrCreate(String name, String email, String phone, String address) {
        var now = LocalDateTime.now();
        return supplierRepository.findFirstByName(name)
                .orElseGet(() -> supplierRepository.save(Supplier.builder()
                        .name(name)
                        .email(email)
                        .phone(phone)
                        .address(address)
                        .createdAt(now)
                        .updatedAt(now)
                        .build()));
    }

    public Page<Supplier> findAll(String search, Pageable pageable) {
        if (search != null && !search.isBlank())
            return supplierRepository.findByNameContainingIgnoreCaseOrContactPersonContainingIgnoreCase(search, search, pageable);
        return supplierRepository.findAll(pageable);
    }

    public Supplier getById(String id) {
        return supplierRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
    }

    public Supplier update(String id, Supplier s) {
        Supplier existing = getById(id);
        if (s.getName() != null) existing.setName(s.getName());
        if (s.getContactPerson() != null) existing.setContactPerson(s.getContactPerson());
        if (s.getEmail() != null) existing.setEmail(s.getEmail());
        if (s.getPhone() != null) existing.setPhone(s.getPhone());
        if (s.getAddress() != null) existing.setAddress(s.getAddress());
        existing.setUpdatedAt(LocalDateTime.now());
        return supplierRepository.save(existing);
    }

    public long count() {
        return supplierRepository.count();
    }
}
