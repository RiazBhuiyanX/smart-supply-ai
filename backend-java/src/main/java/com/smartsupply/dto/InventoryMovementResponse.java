package com.smartsupply.dto;

import com.smartsupply.entity.MovementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovementResponse {
    private String id;
    private String inventoryItemId;
    private String productSku;
    private String productName;
    private String warehouseName;
    private MovementType movementType;
    private Integer quantity;
    private Integer quantityBefore;
    private Integer quantityAfter;
    private String reason;
    private String referenceType;
    private String referenceId;
    private String performedByName;
    private LocalDateTime createdAt;
}
