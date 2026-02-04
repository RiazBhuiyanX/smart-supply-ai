package com.smartsupply.service;

import com.smartsupply.dto.CreatePurchaseOrderRequest;
import com.smartsupply.dto.PurchaseOrderResponse;
import com.smartsupply.dto.ReceiveItemsRequest;
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
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final WarehouseRepository warehouseRepository;

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

        String orderNumber = generateOrderNumber();

        PurchaseOrder order = PurchaseOrder.builder()
                .orderNumber(orderNumber)
                .supplier(supplier)
                .createdBy(null)
                .status(request.getStatus() != null ? request.getStatus() : OrderStatus.DRAFT)
                .expectedDate(request.getExpectedDate())
                .build();

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
    public PurchaseOrderResponse updatePurchaseOrder(String id, CreatePurchaseOrderRequest request) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase order not found"));

        // Only allow editing DRAFT orders
        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new RuntimeException("Can only edit orders in DRAFT status. Current status: " + order.getStatus());
        }

        // Update supplier if changed
        if (request.getSupplierId() != null && !request.getSupplierId().equals(order.getSupplier().getId())) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new RuntimeException("Supplier not found"));
            order.setSupplier(supplier);
        }

        // Update expected date
        if (request.getExpectedDate() != null) {
            order.setExpectedDate(request.getExpectedDate());
        }

        // Clear and rebuild items
        order.getItems().clear();
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
    public PurchaseOrderResponse receiveItems(String id, ReceiveItemsRequest request) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase order not found"));

        // Only allow receiving from SENT orders
        if (order.getStatus() != OrderStatus.SENT) {
            throw new RuntimeException("Can only receive items from SENT orders. Current status: " + order.getStatus());
        }

        // Get warehouse
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));

        // Create map of items for quick lookup
        Map<String, PurchaseOrderItem> itemMap = order.getItems().stream()
                .collect(Collectors.toMap(PurchaseOrderItem::getId, item -> item));

        // Process each received item
        for (ReceiveItemsRequest.ReceivedItem receivedItem : request.getItems()) {
            PurchaseOrderItem poItem = itemMap.get(receivedItem.getPurchaseOrderItemId());
            if (poItem == null) {
                throw new RuntimeException("Item not found in order: " + receivedItem.getPurchaseOrderItemId());
            }

            int quantityToReceive = receivedItem.getQuantityReceived();
            int remainingToReceive = poItem.getQuantityOrdered() - poItem.getQuantityReceived();
            
            if (quantityToReceive > remainingToReceive) {
                throw new RuntimeException("Cannot receive more than ordered. Remaining: " + remainingToReceive);
            }

            // Update quantity received on PO item
            poItem.setQuantityReceived(poItem.getQuantityReceived() + quantityToReceive);

            // Find or create inventory item
            InventoryItem inventoryItem = inventoryItemRepository
                    .findByProductIdAndWarehouseId(poItem.getProduct().getId(), warehouse.getId())
                    .orElseGet(() -> InventoryItem.builder()
                            .product(poItem.getProduct())
                            .warehouse(warehouse)
                            .quantity(0)
                            .reserved(0)
                            .build());

            int oldQuantity = inventoryItem.getQuantity();
            int newQuantity = oldQuantity + quantityToReceive;
            inventoryItem.setQuantity(newQuantity);
            inventoryItem = inventoryItemRepository.save(inventoryItem);

            // Create inventory movement for audit trail
            InventoryMovement movement = InventoryMovement.builder()
                    .inventoryItem(inventoryItem)
                    .movementType(MovementType.IN)
                    .quantity(quantityToReceive)
                    .quantityBefore(oldQuantity)
                    .quantityAfter(newQuantity)
                    .reason("Received from PO: " + order.getOrderNumber())
                    .referenceType("PURCHASE_ORDER")
                    .referenceId(order.getId())
                    .build();
            inventoryMovementRepository.save(movement);
        }

        // Update order status when all items received
        boolean allReceived = order.getItems().stream().allMatch(PurchaseOrderItem::isFullyReceived);

        if (allReceived) {
            order.setStatus(OrderStatus.RECEIVED);
        }
        // If not all received, keep status as SENT

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
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase order not found"));
        
        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new RuntimeException("Can only delete DRAFT orders");
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

