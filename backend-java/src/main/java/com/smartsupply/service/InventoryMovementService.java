package com.smartsupply.service;

import com.smartsupply.dto.CreateInventoryMovementRequest;
import com.smartsupply.dto.InventoryMovementResponse;
import com.smartsupply.entity.InventoryItem;
import com.smartsupply.entity.InventoryMovement;
import com.smartsupply.entity.MovementType;
import com.smartsupply.repository.InventoryItemRepository;
import com.smartsupply.repository.InventoryMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryMovementService {

    private final InventoryMovementRepository movementRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public Page<InventoryMovementResponse> getAllMovements(Pageable pageable) {
        return movementRepository.findAll(pageable)
                .map(this::toResponse);
    }

    public InventoryMovementResponse getMovementById(String id) {
        InventoryMovement movement = movementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory movement not found"));
        return toResponse(movement);
    }

    public List<InventoryMovementResponse> getMovementsByInventoryItem(String inventoryItemId) {
        return movementRepository.findByInventoryItemId(inventoryItemId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<InventoryMovementResponse> getMovementsByType(MovementType type) {
        return movementRepository.findByMovementType(type).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<InventoryMovementResponse> getMovementsByProduct(String productId) {
        return movementRepository.findByProductId(productId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<InventoryMovementResponse> getMovementsByWarehouse(String warehouseId) {
        return movementRepository.findByWarehouseId(warehouseId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<InventoryMovementResponse> getMovementsByDateRange(LocalDateTime from, LocalDateTime to) {
        return movementRepository.findByDateRange(from, to).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public InventoryMovementResponse recordMovement(CreateInventoryMovementRequest request) {
        InventoryItem inventoryItem = inventoryItemRepository.findById(request.getInventoryItemId())
                .orElseThrow(() -> new RuntimeException("Inventory item not found"));

        Integer quantityBefore = inventoryItem.getQuantity();
        Integer quantityAfter;

        // Apply movement to inventory
        switch (request.getMovementType()) {
            case IN:
                quantityAfter = quantityBefore + request.getQuantity();
                inventoryItem.setQuantity(quantityAfter);
                break;
            case OUT:
                if (quantityBefore < request.getQuantity()) {
                    throw new RuntimeException("Insufficient stock. Available: " + quantityBefore);
                }
                quantityAfter = quantityBefore - request.getQuantity();
                inventoryItem.setQuantity(quantityAfter);
                break;
            case ADJUSTMENT:
            case TRANSFER:
                // For adjustments, quantity can be positive (add) or we set absolute
                quantityAfter = quantityBefore + request.getQuantity();
                if (quantityAfter < 0) {
                    throw new RuntimeException("Adjustment would result in negative stock");
                }
                inventoryItem.setQuantity(quantityAfter);
                break;
            default:
                throw new RuntimeException("Unknown movement type");
        }

        inventoryItemRepository.save(inventoryItem);

        InventoryMovement movement = InventoryMovement.builder()
                .inventoryItem(inventoryItem)
                .movementType(request.getMovementType())
                .quantity(request.getQuantity())
                .quantityBefore(quantityBefore)
                .quantityAfter(quantityAfter)
                .reason(request.getReason())
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .performedBy(null) // TODO: Add user tracking
                .build();

        movement = movementRepository.save(movement);
        return toResponse(movement);
    }

    private InventoryMovementResponse toResponse(InventoryMovement movement) {
        return InventoryMovementResponse.builder()
                .id(movement.getId())
                .inventoryItemId(movement.getInventoryItem().getId())
                .productSku(movement.getInventoryItem().getProduct().getSku())
                .productName(movement.getInventoryItem().getProduct().getName())
                .warehouseName(movement.getInventoryItem().getWarehouse().getName())
                .movementType(movement.getMovementType())
                .quantity(movement.getQuantity())
                .quantityBefore(movement.getQuantityBefore())
                .quantityAfter(movement.getQuantityAfter())
                .reason(movement.getReason())
                .referenceType(movement.getReferenceType())
                .referenceId(movement.getReferenceId())
                .performedByName(movement.getPerformedBy() != null 
                        ? movement.getPerformedBy().getFirstName() + " " + movement.getPerformedBy().getLastName()
                        : null)
                .createdAt(movement.getCreatedAt())
                .build();
    }
}
