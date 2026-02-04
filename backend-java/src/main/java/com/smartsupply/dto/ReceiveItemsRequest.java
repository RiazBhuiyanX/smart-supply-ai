package com.smartsupply.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request to receive items from a purchase order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiveItemsRequest {
    
    @NotEmpty(message = "At least one item must be received")
    private List<ReceivedItem> items;
    
    private String warehouseId;
    
    private String notes;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReceivedItem {
        @NotBlank(message = "Item ID is required")
        private String purchaseOrderItemId;
        
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantityReceived;
    }
}
