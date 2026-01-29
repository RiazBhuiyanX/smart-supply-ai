package com.smartsupply.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemResponse {
    private String id;
    private String productId;
    private String productSku;
    private String productName;
    private String warehouseId;
    private String warehouseName;
    private Integer quantity;
    private Integer reserved;
    private Integer available;
    private LocalDateTime lastUpdated;
}
