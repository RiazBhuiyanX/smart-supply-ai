/**
 * Role-Based Access Control (RBAC) Permissions
 * 
 * Roles:
 * - ADMIN: Full access to everything
 * - MANAGER: Can manage products, suppliers, orders, warehouses
 * - PROCUREMENT: Can manage suppliers and purchase orders
 * - WAREHOUSE_OP: Can view and adjust stock only
 */

export type Role = 'ADMIN' | 'MANAGER' | 'PROCUREMENT' | 'WAREHOUSE_OP'

export interface Permissions {
  // Products
  canViewProducts: boolean
  canCreateProducts: boolean
  canEditProducts: boolean
  canDeleteProducts: boolean
  
  // Suppliers
  canViewSuppliers: boolean
  canManageSuppliers: boolean
  
  // Purchase Orders
  canViewOrders: boolean
  canManageOrders: boolean
  
  // Inventory
  canViewInventory: boolean
  canAdjustStock: boolean
  
  // Warehouses
  canViewWarehouses: boolean
  canManageWarehouses: boolean
}

const rolePermissions: Record<Role, Permissions> = {
  ADMIN: {
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewSuppliers: true,
    canManageSuppliers: true,
    canViewOrders: true,
    canManageOrders: true,
    canViewInventory: true,
    canAdjustStock: true,
    canViewWarehouses: true,
    canManageWarehouses: true,
  },
  MANAGER: {
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewSuppliers: true,
    canManageSuppliers: true,
    canViewOrders: true,
    canManageOrders: true,
    canViewInventory: true,
    canAdjustStock: true,
    canViewWarehouses: true,
    canManageWarehouses: true,
  },
  PROCUREMENT: {
    canViewProducts: true,
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canViewSuppliers: true,
    canManageSuppliers: true,
    canViewOrders: true,
    canManageOrders: true,
    canViewInventory: true,
    canAdjustStock: false,
    canViewWarehouses: true,
    canManageWarehouses: false,
  },
  WAREHOUSE_OP: {
    canViewProducts: true,
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canViewSuppliers: true,
    canManageSuppliers: false,
    canViewOrders: true,
    canManageOrders: false,
    canViewInventory: true,
    canAdjustStock: true,
    canViewWarehouses: true,
    canManageWarehouses: false,
  },
}

export function getPermissions(role: Role | null | undefined): Permissions {
  if (!role) {
    // No role = no permissions
    return {
      canViewProducts: false,
      canCreateProducts: false,
      canEditProducts: false,
      canDeleteProducts: false,
      canViewSuppliers: false,
      canManageSuppliers: false,
      canViewOrders: false,
      canManageOrders: false,
      canViewInventory: false,
      canAdjustStock: false,
      canViewWarehouses: false,
      canManageWarehouses: false,
    }
  }
  return rolePermissions[role] || rolePermissions.WAREHOUSE_OP
}

export function canPerformAction(role: Role | null | undefined, permission: keyof Permissions): boolean {
  return getPermissions(role)[permission]
}
