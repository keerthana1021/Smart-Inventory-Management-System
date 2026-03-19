package com.example.demo.repository;

import com.example.demo.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface InventoryTransactionRepository extends MongoRepository<InventoryTransaction, String> {
    Page<InventoryTransaction> findByProductId(String productId, Pageable pageable);
    Page<InventoryTransaction> findByProductIdAndTransactionType(String productId, InventoryTransaction.TransactionType type, Pageable pageable);
    Page<InventoryTransaction> findByTransactionType(InventoryTransaction.TransactionType type, Pageable pageable);
    List<InventoryTransaction> findTop20ByOrderByTransactionDateDesc(Pageable pageable);
}
