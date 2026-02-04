package com.smartsupply.repository;

import com.smartsupply.entity.InventoryMovement;
import com.smartsupply.entity.MovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, String> {
    
    List<InventoryMovement> findByInventoryItemId(String inventoryItemId);
    
    Page<InventoryMovement> findByInventoryItemId(String inventoryItemId, Pageable pageable);
    
    List<InventoryMovement> findByMovementType(MovementType movementType);
    
    @Query("SELECT m FROM InventoryMovement m WHERE m.createdAt >= :from AND m.createdAt <= :to")
    List<InventoryMovement> findByDateRange(LocalDateTime from, LocalDateTime to);
    
    @Query("SELECT m FROM InventoryMovement m WHERE m.inventoryItem.product.id = :productId")
    List<InventoryMovement> findByProductId(String productId);
    
    @Query("SELECT m FROM InventoryMovement m WHERE m.inventoryItem.warehouse.id = :warehouseId")
    List<InventoryMovement> findByWarehouseId(String warehouseId);
    
    List<InventoryMovement> findByReferenceTypeAndReferenceId(String referenceType, String referenceId);
    
    void deleteByInventoryItemId(String inventoryItemId);
    
    @Query("DELETE FROM InventoryMovement m WHERE m.inventoryItem.product.id = :productId")
    @Modifying
    void deleteByProductId(String productId);
}
