package com.smartsupply.entity;

/**
 * Type of inventory movement (audit trail).
 */
public enum MovementType {
    IN,          // Stock added (received from supplier, returned, etc.)
    OUT,         // Stock removed (sold, shipped, etc.)
    ADJUSTMENT,  // Manual inventory adjustment (correction)
    TRANSFER     // Transfer between warehouses
}
