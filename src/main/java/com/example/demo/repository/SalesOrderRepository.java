package com.example.demo.repository;

import com.example.demo.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface SalesOrderRepository extends MongoRepository<SalesOrder, String> {
    boolean existsByOrderNumber(String orderNumber);
    Page<SalesOrder> findByOrderNumberContaining(String search, Pageable pageable);
    long countByStatus(SalesOrder.OrderStatus status);

    /** All orders in any of the given statuses (no date filter — matches dashboard / revenue totals). */
    List<SalesOrder> findByStatusIn(Collection<SalesOrder.OrderStatus> statuses);

    List<SalesOrder> findByStatusInAndCreatedAtGreaterThanEqual(List<SalesOrder.OrderStatus> statuses, LocalDateTime from);
    List<SalesOrder> findByStatusInAndCreatedAtBetween(List<SalesOrder.OrderStatus> statuses, LocalDateTime from, LocalDateTime to);

    Page<SalesOrder> findByItemsProductId(String productId, Pageable pageable);
}
