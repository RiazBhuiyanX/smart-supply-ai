package com.smartsupply.entity;

/**
 * Status of a purchase order.
 */
public enum OrderStatus {
    DRAFT,      // Order created but not sent
    SENT,       // Order sent to supplier
    RECEIVED,   // All items received
    CANCELLED   // Order cancelled
}
