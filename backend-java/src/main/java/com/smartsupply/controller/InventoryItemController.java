package com.smartsupply.controller;

import com.smartsupply.dto.CreateInventoryItemRequest;
import com.smartsupply.dto.InventoryItemResponse;
import com.smartsupply.service.InventoryItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;

    @GetMapping
    public ResponseEntity<Page<InventoryItemResponse>> getAllInventory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(inventoryItemService.getAllInventoryItems(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryItemResponse> getInventoryItem(@PathVariable String id) {
        return ResponseEntity.ok(inventoryItemService.getInventoryItem(id));
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<InventoryItemResponse>> getByWarehouse(
            @PathVariable String warehouseId) {
        return ResponseEntity.ok(inventoryItemService.getInventoryByWarehouse(warehouseId));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<InventoryItemResponse>> getByProduct(
            @PathVariable String productId) {
        return ResponseEntity.ok(inventoryItemService.getInventoryByProduct(productId));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryItemResponse>> getLowStock() {
        return ResponseEntity.ok(inventoryItemService.getLowStockItems());
    }

    @PostMapping
    public ResponseEntity<InventoryItemResponse> createOrUpdateInventory(
            @Valid @RequestBody CreateInventoryItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventoryItemService.createOrUpdateInventory(request));
    }

    @PostMapping("/{id}/adjust")
    public ResponseEntity<InventoryItemResponse> adjustQuantity(
            @PathVariable String id,
            @RequestBody java.util.Map<String, Object> body) {
        int newQuantity = (Integer) body.get("newQuantity");
        String reason = (String) body.getOrDefault("reason", "Manual adjustment");
        return ResponseEntity.ok(inventoryItemService.adjustQuantity(id, newQuantity, reason));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInventoryItem(@PathVariable String id) {
        inventoryItemService.deleteInventoryItem(id);
        return ResponseEntity.noContent().build();
    }
}
