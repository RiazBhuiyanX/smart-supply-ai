package com.smartsupply.dto;

import com.smartsupply.entity.OrderStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePurchaseOrderRequest {
    
    @NotBlank(message = "Supplier ID is required")
    private String supplierId;
    
    private LocalDate expectedDate;
    
    private OrderStatus status;
    
    @NotEmpty(message = "At least one item is required")
    private List<PurchaseOrderItemRequest> items;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseOrderItemRequest {
        @NotBlank(message = "Product ID is required")
        private String productId;
        
        private Integer quantity;
        
        private Double unitPrice;
    }
}
