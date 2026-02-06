package com.smartsupply.service;

import com.smartsupply.dto.DashboardStatsDTO;
import com.smartsupply.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public DashboardStatsDTO getDashboardStats() {
        // 1. Basic Counts
        long totalSuppliers = supplierRepository.count();
        long totalProducts = productRepository.count();
        long totalWarehouses = warehouseRepository.count();
        long totalOrders = purchaseOrderRepository.count();

        // 2. Best Supplier (by Revenue)
        String bestSupplierName = "-";
        BigDecimal bestSupplierTotal = BigDecimal.ZERO;
        List<Object[]> topSuppliers = purchaseOrderRepository.findTopSuppliersByTotalAmount(PageRequest.of(0, 1));
        if (!topSuppliers.isEmpty()) {
            Object[] row = topSuppliers.get(0);
            bestSupplierName = (String) row[0];
            bestSupplierTotal = (BigDecimal) row[1];
        }

        // 3. Most Stocked Product
        String mostStockedProduct = "-";
        int mostStockedQty = 0;
        List<Object[]> mostStocked = inventoryItemRepository.findMostStockedProducts(PageRequest.of(0, 1));
        if (!mostStocked.isEmpty()) {
            Object[] row = mostStocked.get(0);
            mostStockedProduct = (String) row[0];
            mostStockedQty = ((Number) row[1]).intValue();
        }

        // 4. Least Stocked Product (but greater than 0 ideally, or just the absolute minimum)
        String leastStockedProduct = "-";
        int leastStockedQty = 0;
        List<Object[]> leastStocked = inventoryItemRepository.findLeastStockedProducts(PageRequest.of(0, 1));
        if (!leastStocked.isEmpty()) {
            Object[] row = leastStocked.get(0);
            leastStockedProduct = (String) row[0];
            leastStockedQty = ((Number) row[1]).intValue();
        }

        // 5. Low Stock Products (Quantity <= Safety Stock) - Just getting names for now
        // Or we can use findLeastStockedProducts limit 5
        List<String> lowStockProducts = new ArrayList<>();
        List<Object[]> bottom5 = inventoryItemRepository.findLeastStockedProducts(PageRequest.of(0, 5));
        for (Object[] row : bottom5) {
            lowStockProducts.add((String) row[0] + " (" + ((Number) row[1]).intValue() + ")");
        }

        return DashboardStatsDTO.builder()
                .totalSuppliers(totalSuppliers)
                .totalProducts(totalProducts)
                .totalWarehouses(totalWarehouses)
                .totalOrders(totalOrders)
                .bestSupplierName(bestSupplierName)
                .bestSupplierTotalAmount(bestSupplierTotal)
                .mostStockedProduct(mostStockedProduct)
                .mostStockedQuantity(mostStockedQty)
                .leastStockedProduct(leastStockedProduct)
                .leastStockedQuantity(leastStockedQty)
                .lowStockProducts(lowStockProducts)
                .build();
    }
}
