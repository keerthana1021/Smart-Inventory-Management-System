package com.example.demo.repository;

import com.example.demo.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SupplierRepository extends MongoRepository<Supplier, String> {
    Page<Supplier> findByNameContainingIgnoreCaseOrContactPersonContainingIgnoreCase(String name, String contact, Pageable pageable);
    Optional<Supplier> findFirstByName(String name);
}
