package com.smartsupply.service;

import com.smartsupply.dto.CreateInventoryItemRequest;
import com.smartsupply.dto.InventoryItemResponse;
import com.smartsupply.entity.InventoryItem;
import com.smartsupply.entity.InventoryMovement;
import com.smartsupply.entity.MovementType;
import com.smartsupply.entity.Product;
import com.smartsupply.entity.Warehouse;
import com.smartsupply.repository.InventoryItemRepository;
import com.smartsupply.repository.InventoryMovementRepository;
import com.smartsupply.repository.ProductRepository;
import com.smartsupply.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryItemService {

    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    public Page<InventoryItemResponse> getAllInventoryItems(Pageable pageable) {
        return inventoryItemRepository.findAll(pageable)
                .map(this::toResponse);
    }

    public Page<InventoryItemResponse> searchInventoryItems(String search, Pageable pageable) {
        return inventoryItemRepository.searchByProductOrWarehouse(search, pageable)
                .map(this::toResponse);
    }

    public List<InventoryItemResponse> getInventoryByWarehouse(String warehouseId) {
        return inventoryItemRepository.findByWarehouseId(warehouseId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<InventoryItemResponse> getInventoryByProduct(String productId) {
        return inventoryItemRepository.findByProductId(productId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public InventoryItemResponse getInventoryItem(String id) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));
        return toResponse(item);
    }

    public InventoryItemResponse createOrUpdateInventory(CreateInventoryItemRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        // Check if inventory item already exists for this product-warehouse combo
        InventoryItem item = inventoryItemRepository
                .findByProductIdAndWarehouseId(request.getProductId(), request.getWarehouseId())
                .orElse(InventoryItem.builder()
                        .product(product)
                        .warehouse(warehouse)
                        .quantity(0)
                        .reserved(0)
                        .build());

        item.setQuantity(request.getQuantity() != null ? request.getQuantity() : item.getQuantity());
        item.setReserved(request.getReserved() != null ? request.getReserved() : item.getReserved());

        item = inventoryItemRepository.save(item);
        return toResponse(item);
    }

    public InventoryItemResponse adjustQuantity(String id, int newQuantity, String reason) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        if (newQuantity < 0) {
            throw new RuntimeException("Cannot have negative quantity");
        }
        
        int oldQuantity = item.getQuantity();
        int adjustment = newQuantity - oldQuantity;
        
        // Create audit trail entry
        InventoryMovement movement = InventoryMovement.builder()
                .inventoryItem(item)
                .movementType(adjustment >= 0 ? MovementType.IN : MovementType.OUT)
                .quantity(Math.abs(adjustment))
                .quantityBefore(oldQuantity)
                .quantityAfter(newQuantity)
                .reason(reason)
                .referenceType("MANUAL_ADJUSTMENT")
                .build();
        inventoryMovementRepository.save(movement);
        
        item.setQuantity(newQuantity);
        item = inventoryItemRepository.save(item);
        return toResponse(item);
    }

    public List<InventoryItemResponse> getLowStockItems() {
        return inventoryItemRepository.findLowStockItems().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public void deleteInventoryItem(String id) {
        if (!inventoryItemRepository.existsById(id)) {
            throw new RuntimeException("Inventory item not found");
        }
        inventoryItemRepository.deleteById(id);
    }

    private InventoryItemResponse toResponse(InventoryItem item) {
        return InventoryItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productSku(item.getProduct().getSku())
                .productName(item.getProduct().getName())
                .warehouseId(item.getWarehouse().getId())
                .warehouseName(item.getWarehouse().getName())
                .quantity(item.getQuantity())
                .reserved(item.getReserved())
                .available(item.getAvailable())
                .lastUpdated(item.getLastUpdated())
                .build();
    }
}
