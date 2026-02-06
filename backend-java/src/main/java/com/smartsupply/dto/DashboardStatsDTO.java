package com.smartsupply.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardStatsDTO {
    private long totalSuppliers;
    private long totalProducts;
    private long totalWarehouses;
    private long totalOrders;
    
    private String bestSupplierName;
    private BigDecimal bestSupplierTotalAmount;
    
    private String mostStockedProduct;
    private int mostStockedQuantity;
    
    private String leastStockedProduct;
    private int leastStockedQuantity;
    
    private List<String> lowStockProducts; // Top 5
}
