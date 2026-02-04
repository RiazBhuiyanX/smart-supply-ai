package com.smartsupply.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * InventoryMovement entity - Audit trail for all inventory changes.
 * Tracks every stock IN, OUT, ADJUSTMENT, or TRANSFER.
 */
@Entity
@Table(name = "inventory_movements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovement {

    @Id
    @UuidGenerator
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovementType movementType;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "quantity_before")
    private Integer quantityBefore;

    @Column(name = "quantity_after")
    private Integer quantityAfter;

    @Column(length = 500)
    private String reason;

    @Column(name = "reference_type")
    private String referenceType;  // e.g., "PURCHASE_ORDER", "SALE"

    @Column(name = "reference_id")
    private String referenceId;    // e.g., PO ID or Sale ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by_user_id")
    private User performedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
