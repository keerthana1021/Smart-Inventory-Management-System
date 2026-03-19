package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PurchaseOrderServiceTest {

    @Mock private PurchaseOrderRepository purchaseOrderRepository;
    @Mock private ProductRepository productRepository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private UserRepository userRepository;
    @Mock private InventoryTransactionRepository transactionRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private PurchaseOrderService purchaseOrderService;

    private PurchaseOrder pendingOrder;
    private PurchaseOrder approvedOrder;

    @BeforeEach
    void setUp() {
        var item = PurchaseOrderItem.builder().productId("p1").quantity(10).unitPrice(BigDecimal.TEN).build();
        pendingOrder = PurchaseOrder.builder()
                .id("po1").orderNumber("PO-ABC").supplierId("s1")
                .status(PurchaseOrder.OrderStatus.PENDING_APPROVAL)
                .items(List.of(item)).totalAmount(BigDecimal.valueOf(100)).createdAt(LocalDateTime.now())
                .build();
        approvedOrder = PurchaseOrder.builder()
                .id("po2").orderNumber("PO-XYZ").supplierId("s1")
                .status(PurchaseOrder.OrderStatus.APPROVED)
                .items(List.of(item)).totalAmount(BigDecimal.valueOf(100)).createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findByUsername(any())).thenReturn(Optional.of(User.builder().id("u1").username("admin").build()));
    }

    @Test
    void approve_movesToApproved() {
        when(purchaseOrderRepository.findById("po1")).thenReturn(Optional.of(pendingOrder));
        when(purchaseOrderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        mockSecurityContext("admin");

        PurchaseOrder result = purchaseOrderService.approve("po1");

        assertEquals(PurchaseOrder.OrderStatus.APPROVED, result.getStatus());
        verify(purchaseOrderRepository).save(pendingOrder);
        verify(productRepository, never()).save(any());
    }

    @Test
    void approve_whenNotPending_throws() {
        when(purchaseOrderRepository.findById("po2")).thenReturn(Optional.of(approvedOrder));
        mockSecurityContext("admin");

        assertThrows(BadRequestException.class, () -> purchaseOrderService.approve("po2"));
        verify(purchaseOrderRepository, never()).save(any());
    }

    @Test
    void receive_updatesStockAndMovesToReceived() {
        when(purchaseOrderRepository.findById("po2")).thenReturn(Optional.of(approvedOrder));
        Product product = Product.builder().id("p1").currentQuantity(5).build();
        when(productRepository.findById("p1")).thenReturn(Optional.of(product));
        when(purchaseOrderRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        mockSecurityContext("admin");

        PurchaseOrder result = purchaseOrderService.receive("po2");

        assertEquals(PurchaseOrder.OrderStatus.RECEIVED, result.getStatus());
        assertEquals(15, product.getCurrentQuantity());
        verify(productRepository).save(product);
        verify(transactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    void receive_whenNotApproved_throws() {
        when(purchaseOrderRepository.findById("po1")).thenReturn(Optional.of(pendingOrder));
        mockSecurityContext("admin");

        assertThrows(BadRequestException.class, () -> purchaseOrderService.receive("po1"));
        verify(productRepository, never()).save(any());
    }

    @Test
    void getById_notFound_throws() {
        when(purchaseOrderRepository.findById("missing")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> purchaseOrderService.getById("missing"));
    }

    private void mockSecurityContext(String username) {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(username);
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);
    }
}
