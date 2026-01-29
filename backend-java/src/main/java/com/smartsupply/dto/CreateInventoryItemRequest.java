package com.smartsupply.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInventoryItemRequest {
    
    @NotBlank(message = "Product ID is required")
    private String productId;
    
    @NotBlank(message = "Warehouse ID is required")
    private String warehouseId;
    
    @PositiveOrZero(message = "Quantity must be positive or zero")
    private Integer quantity;
    
    @PositiveOrZero(message = "Reserved must be positive or zero")
    private Integer reserved;
}
