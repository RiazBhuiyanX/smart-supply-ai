"""
Django Admin — FREE admin UI for managing your data.

THIS HAS NO EQUIVALENT IN SPRING BOOT.
Spring Boot doesn't give you a UI — you need to build it or use Spring Admin.
Django gives you a full CRUD admin panel at /admin/ out of the box.

Just register your models here and you get:
- List view with search, filters, pagination
- Create/Edit forms with validation
- Delete with confirmation
- User management built-in
"""

from django.contrib import admin
from .models import Product, Warehouse, Supplier, InventoryItem, InventoryMovement


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    # Which columns to show in the list view
    list_display = ["sku", "name", "category", "price", "safety_stock"]
    # Which fields to search by
    search_fields = ["sku", "name", "category"]
    # Sidebar filters
    list_filter = ["category"]


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ["name", "location", "type", "capacity"]
    list_filter = ["type"]


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "phone", "contact_person"]
    search_fields = ["name", "email"]


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = [
        "product",
        "warehouse",
        "quantity",
        "reserved",
        "available",
        "last_updated",
    ]
    list_filter = ["warehouse"]
    search_fields = ["product__name", "product__sku"]

    def available(self, obj):
        return obj.available

    available.short_description = "Available Stock"


@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = [
        "inventory_item",
        "movement_type",
        "quantity",
        "quantity_before",
        "quantity_after",
        "reason",
        "created_at",
    ]
    list_filter = ["movement_type", "created_at"]
    search_fields = ["inventory_item__product__name", "reason"]
    # Make it read-only — movements are append-only audit trail
    readonly_fields = [
        "inventory_item",
        "movement_type",
        "quantity",
        "quantity_before",
        "quantity_after",
        "reason",
        "reference_type",
        "reference_id",
        "performed_by",
        "created_at",
    ]
