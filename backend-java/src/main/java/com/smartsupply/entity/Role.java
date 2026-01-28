package com.smartsupply.entity;

/**
 * Role enum - matches NestJS/Prisma Role enum exactly.
 * 
 * In NestJS:    enum Role { ADMIN = 'ADMIN', ... }
 * In Java:      enum Role { ADMIN, ... }
 */
public enum Role {
    ADMIN,
    MANAGER,
    WAREHOUSE_OP,
    PROCUREMENT
}
