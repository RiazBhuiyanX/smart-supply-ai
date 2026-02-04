package com.smartsupply.dto;

import com.smartsupply.entity.MovementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInventoryMovementRequest {
    
    @NotBlank(message = "Inventory item ID is required")
    private String inventoryItemId;
    
    @NotNull(message = "Movement type is required")
    private MovementType movementType;
    
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;
    
    private String reason;
    
    private String referenceType;
    private String referenceId;
}
