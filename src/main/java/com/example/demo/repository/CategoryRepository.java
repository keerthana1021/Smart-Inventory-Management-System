package com.example.demo.repository;

import com.example.demo.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CategoryRepository extends MongoRepository<Category, String> {
    Page<Category> findByNameContainingIgnoreCase(String search, Pageable pageable);
    boolean existsByName(String name);
    Optional<Category> findByName(String name);
}
