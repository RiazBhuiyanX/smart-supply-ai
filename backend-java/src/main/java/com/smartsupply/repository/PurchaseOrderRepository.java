package com.smartsupply.repository;

import com.smartsupply.entity.OrderStatus;
import com.smartsupply.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, String> {
    
    Optional<PurchaseOrder> findByOrderNumber(String orderNumber);
    
    List<PurchaseOrder> findBySupplierId(String supplierId);
    
    List<PurchaseOrder> findByStatus(OrderStatus status);
    
    Page<PurchaseOrder> findByStatus(OrderStatus status, Pageable pageable);
    
    List<PurchaseOrder> findByCreatedById(String userId);
}
