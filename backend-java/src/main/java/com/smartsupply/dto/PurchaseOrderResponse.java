package com.smartsupply.dto;

import com.smartsupply.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderResponse {
    private String id;
    private String orderNumber;
    private String supplierId;
    private String supplierName;
    private String createdById;
    private String createdByName;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private LocalDate expectedDate;
    private LocalDateTime createdAt;
    private List<PurchaseOrderItemResponse> items;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseOrderItemResponse {
        private String id;
        private String productId;
        private String productSku;
        private String productName;
        private Integer quantityOrdered;
        private Integer quantityReceived;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }
}
