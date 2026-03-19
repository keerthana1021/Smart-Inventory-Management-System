package com.example.demo.repository;

import com.example.demo.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PurchaseOrderRepository extends MongoRepository<PurchaseOrder, String> {
    boolean existsByOrderNumber(String orderNumber);
    Page<PurchaseOrder> findByOrderNumberContaining(String search, Pageable pageable);
    Page<PurchaseOrder> findByStatus(PurchaseOrder.OrderStatus status, Pageable pageable);
    Page<PurchaseOrder> findByOrderNumberContainingAndStatus(String search, PurchaseOrder.OrderStatus status, Pageable pageable);
    long countByStatus(PurchaseOrder.OrderStatus status);

    Page<PurchaseOrder> findByItemsProductId(String productId, Pageable pageable);
}
