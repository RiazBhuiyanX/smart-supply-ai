package com.smartsupply.controller;

import com.smartsupply.dto.CreateInventoryMovementRequest;
import com.smartsupply.dto.InventoryMovementResponse;
import com.smartsupply.entity.MovementType;
import com.smartsupply.service.InventoryMovementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/inventory-movements")
@RequiredArgsConstructor
public class InventoryMovementController {

    private final InventoryMovementService movementService;

    @GetMapping
    public ResponseEntity<Page<InventoryMovementResponse>> getAllMovements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(movementService.getAllMovements(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryMovementResponse> getMovement(@PathVariable String id) {
        return ResponseEntity.ok(movementService.getMovementById(id));
    }

    @GetMapping("/inventory-item/{inventoryItemId}")
    public ResponseEntity<List<InventoryMovementResponse>> getByInventoryItem(
            @PathVariable String inventoryItemId) {
        return ResponseEntity.ok(movementService.getMovementsByInventoryItem(inventoryItemId));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<InventoryMovementResponse>> getByType(
            @PathVariable MovementType type) {
        return ResponseEntity.ok(movementService.getMovementsByType(type));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<InventoryMovementResponse>> getByProduct(
            @PathVariable String productId) {
        return ResponseEntity.ok(movementService.getMovementsByProduct(productId));
    }

    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<InventoryMovementResponse>> getByWarehouse(
            @PathVariable String warehouseId) {
        return ResponseEntity.ok(movementService.getMovementsByWarehouse(warehouseId));
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<InventoryMovementResponse>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(movementService.getMovementsByDateRange(from, to));
    }

    @PostMapping
    public ResponseEntity<InventoryMovementResponse> recordMovement(
            @Valid @RequestBody CreateInventoryMovementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(movementService.recordMovement(request));
    }
}
