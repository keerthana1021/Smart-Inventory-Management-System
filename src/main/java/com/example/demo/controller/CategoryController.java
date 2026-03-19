package com.example.demo.controller;

import com.example.demo.entity.Category;
import com.example.demo.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Category> create(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(categoryService.create(body.get("name"), body.get("description")));
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String search,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(categoryService.findAll(search, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public Category getById(@PathVariable String id) {
        return categoryService.getById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Category update(@PathVariable String id, @RequestBody Map<String, String> body) {
        return categoryService.update(id, body.get("name"), body.get("description"));
    }
}
