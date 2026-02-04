package com.smartsupply.service;

import com.smartsupply.dto.CreatePurchaseOrderRequest;
import com.smartsupply.dto.PurchaseOrderResponse;
import com.smartsupply.entity.*;
import com.smartsupply.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;

    public Page<PurchaseOrderResponse> getAllPurchaseOrders(Pageable pageable) {
        return purchaseOrderRepository.findAll(pageable)
                .map(this::toResponse);
    }

    public PurchaseOrderResponse getPurchaseOrderById(String id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase order not found"));
        return toResponse(order);
    }

    public List<PurchaseOrderResponse> getOrdersByStatus(OrderStatus status) {
        return purchaseOrderRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<PurchaseOrderResponse> getOrdersBySupplier(String supplierId) {
        return purchaseOrderRepository.findBySupplierId(supplierId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(CreatePurchaseOrderRequest request, String userId) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        // Generate order number
        String orderNumber = generateOrderNumber();

        PurchaseOrder order = PurchaseOrder.builder()
                .orderNumber(orderNumber)
                .supplier(supplier)
                .createdBy(null) // TODO: Add user tracking later
                .status(request.getStatus() != null ? request.getStatus() : OrderStatus.DRAFT)
                .expectedDate(request.getExpectedDate())
                .build();

        // Add items
        for (CreatePurchaseOrderRequest.PurchaseOrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemRequest.getProductId()));

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(order)
                    .product(product)
                    .quantityOrdered(itemRequest.getQuantity() != null ? itemRequest.getQuantity() : 1)
                    .unitPrice(itemRequest.getUnitPrice() != null 
                            ? BigDecimal.valueOf(itemRequest.getUnitPrice()) 
                            : product.getPrice())
                    .build();

            order.getItems().add(item);
        }

        order.recalculateTotal();
        order = purchaseOrderRepository.save(order);
        return toResponse(order);
    }

    @Transactional
    public PurchaseOrderResponse updateStatus(String id, OrderStatus status) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase order not found"));

        order.setStatus(status);
        order = purchaseOrderRepository.save(order);
        return toResponse(order);
    }

    @Transactional
    public void deletePurchaseOrder(String id) {
        if (!purchaseOrderRepository.existsById(id)) {
            throw new RuntimeException("Purchase order not found");
        }
        purchaseOrderRepository.deleteById(id);
    }

    private String generateOrderNumber() {
        String prefix = "PO-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        long count = purchaseOrderRepository.count() + 1;
        return String.format("%s-%03d", prefix, count);
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder order) {
        List<PurchaseOrderResponse.PurchaseOrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> PurchaseOrderResponse.PurchaseOrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productSku(item.getProduct().getSku())
                        .productName(item.getProduct().getName())
                        .quantityOrdered(item.getQuantityOrdered())
                        .quantityReceived(item.getQuantityReceived())
                        .unitPrice(item.getUnitPrice())
                        .lineTotal(item.getLineTotal())
                        .build())
                .collect(Collectors.toList());

        return PurchaseOrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .supplierId(order.getSupplier().getId())
                .supplierName(order.getSupplier().getName())
                .createdById(order.getCreatedBy() != null ? order.getCreatedBy().getId() : null)
                .createdByName(order.getCreatedBy() != null 
                        ? order.getCreatedBy().getFirstName() + " " + order.getCreatedBy().getLastName() 
                        : null)
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .expectedDate(order.getExpectedDate())
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .build();
    }
}
