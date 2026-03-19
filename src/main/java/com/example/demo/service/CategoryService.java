package com.example.demo.service;

import com.example.demo.entity.Category;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public Category create(String name, String description) {
        String trimmed = name != null ? name.trim() : null;
        if (trimmed == null || trimmed.isEmpty()) {
            throw new BadRequestException("Category name is required.");
        }
        var now = LocalDateTime.now();
        return categoryRepository.findByName(trimmed)
                .map(existing -> {
                    existing.setDescription(description != null ? description : existing.getDescription());
                    existing.setUpdatedAt(now);
                    return categoryRepository.save(existing);
                })
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name(trimmed)
                        .description(description)
                        .createdAt(now)
                        .updatedAt(now)
                        .build()));
    }

    public Page<Category> findAll(String search, Pageable pageable) {
        if (search != null && !search.isBlank())
            return categoryRepository.findByNameContainingIgnoreCase(search, pageable);
        return categoryRepository.findAll(pageable);
    }

    public Category getById(String id) {
        return categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    public Category update(String id, String name, String description) {
        Category c = getById(id);
        c.setName(name);
        c.setDescription(description);
        c.setUpdatedAt(LocalDateTime.now());
        return categoryRepository.save(c);
    }
}
