package com.smartsupply.entity;

/**
 * Status of a purchase order.
 */
public enum OrderStatus {
    DRAFT,              // Order created but not submitted
    SUBMITTED,          // Order submitted for approval
    APPROVED,           // Order approved by manager
    ORDERED,            // Order sent to supplier
    PARTIALLY_RECEIVED, // Some items received
    RECEIVED,           // All items received
    CANCELLED           // Order cancelled
}
