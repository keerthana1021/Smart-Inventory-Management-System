package com.example.demo.repository;

import com.example.demo.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findBySku(String sku);
    Optional<Product> findByBarcode(String barcode);
    boolean existsBySku(String sku);
    Page<Product> findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(String name, String sku, Pageable pageable);
    Page<Product> findByCategoryId(String categoryId, Pageable pageable);
    Page<Product> findBySupplierId(String supplierId, Pageable pageable);
    Page<Product> findByWarehouseId(String warehouseId, Pageable pageable);

    @Query("{ $expr: { $lte: [ '$currentQuantity', '$reorderLevel' ] }, 'active': true }")
    List<Product> findLowStockProducts();

    long countByActiveTrue();
}
