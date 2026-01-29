package com.smartsupply.repository;

import com.smartsupply.entity.InventoryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    Optional<InventoryItem> findByProductIdAndWarehouseId(String productId, String warehouseId);
    
    List<InventoryItem> findByProductId(String productId);
    
    List<InventoryItem> findByWarehouseId(String warehouseId);
    
    Page<InventoryItem> findByWarehouseId(String warehouseId, Pageable pageable);
    
    @Query("SELECT i FROM InventoryItem i WHERE i.quantity <= i.product.safetyStock")
    List<InventoryItem> findLowStockItems();
    
    @Query("SELECT i FROM InventoryItem i WHERE i.quantity - i.reserved <= 0")
    List<InventoryItem> findOutOfStockItems();
}
