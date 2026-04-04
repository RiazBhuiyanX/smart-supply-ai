"""
Models for the inventory app.

THIS IS LIKE YOUR entity/ FOLDER IN JAVA.
Each class here = one @Entity class in Spring Boot.
Django ORM = Hibernate/JPA equivalent.

Key differences from Java/JPA:
- No @Id needed — Django adds 'id' (BigAutoField) automatically
- No @Column annotations — just define the field
- No Lombok — Python doesn't need getters/setters (attributes are public)
- No @Builder — Python uses keyword arguments: Product(name="X", sku="Y")
- TextChoices = Java enum
- ForeignKey = @ManyToOne
- unique_together = @UniqueConstraint
"""

from django.db import models


# ============================================================
# ENUMS — Like your Java enums (WarehouseType, MovementType)
# In Django, enums are defined as inner classes using TextChoices
# ============================================================


class WarehouseType(models.TextChoices):
    """Like your WarehouseType.java enum"""

    PHYSICAL = "PHYSICAL", "Physical"
    VIRTUAL = "VIRTUAL", "Virtual"
    # Format: CONSTANT = "db_value", "Human-readable label"


class MovementType(models.TextChoices):
    """Like your MovementType.java enum"""

    IN = "IN", "Stock In"
    OUT = "OUT", "Stock Out"
    ADJUSTMENT = "ADJUSTMENT", "Adjustment"
    TRANSFER = "TRANSFER", "Transfer"


# ============================================================
# MODELS — Like your @Entity classes
# ============================================================


class Product(models.Model):
    """
    Product entity — Master data for inventory items.

    JAVA EQUIVALENT (your Product.java):
        @Entity @Table(name = "products")
        public class Product {
            @Id @UuidGenerator private String id;
            @Column(unique=true) private String sku;
            ...
        }

    DJANGO DIFFERENCES:
        - 'id' field is auto-created (BigAutoField, auto-increment integer)
          In Java you used UUID — here we use integer PKs (Django default)
        - No need for @Column — just define the field type
        - No Lombok @Data — Python doesn't need getters/setters
        - __str__ method = Java's toString()
        - Meta class = @Table annotations
    """

    # CharField = VARCHAR — like @Column(nullable = false) private String sku;
    sku = models.CharField(max_length=100, unique=True)

    name = models.CharField(max_length=255)

    # blank=True means the form field can be empty
    # null=True means the DB column allows NULL
    # In Java this was just: private String category; (nullable by default)
    category = models.CharField(max_length=100, blank=True, default="")

    # DecimalField = BigDecimal — like @Column(precision=10, scale=2)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # IntegerField = Integer — like private Integer safetyStock;
    safety_stock = models.IntegerField(default=0)

    # auto_now_add=True = @CreationTimestamp
    created_at = models.DateTimeField(auto_now_add=True)
    # auto_now=True = @UpdateTimestamp
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Like @Table(name = "products") in Java"""

        db_table = "products"
        ordering = ["-created_at"]  # Default sort (newest first)

    def __str__(self):
        """Like Java's toString() — used in Django Admin and shell"""
        return f"{self.sku} - {self.name}"


class Warehouse(models.Model):
    """
    Warehouse entity — Physical or virtual storage locations.

    JAVA EQUIVALENT (your Warehouse.java):
        @Entity @Table(name = "warehouses")
        @Enumerated(EnumType.STRING) private WarehouseType type;
        @OneToMany(mappedBy = "warehouse") private List<InventoryItem> inventoryItems;
    """

    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True, default="")

    # CharField with choices = @Enumerated(EnumType.STRING)
    # In Java: @Enumerated(EnumType.STRING) private WarehouseType type;
    type = models.CharField(
        max_length=20,
        choices=WarehouseType.choices,  # Restricts to PHYSICAL/VIRTUAL
        default=WarehouseType.PHYSICAL,
    )

    capacity = models.IntegerField(default=10000)

    # NOTE: @OneToMany doesn't need to be defined here!
    # In Java you had: List<InventoryItem> inventoryItems
    # In Django, the reverse relation is automatic via ForeignKey in InventoryItem
    # Access it with: warehouse.inventory_items.all()  (see InventoryItem.warehouse below)

    class Meta:
        db_table = "warehouses"

    def __str__(self):
        return f"{self.name} ({self.location})"


class Supplier(models.Model):
    """
    Supplier entity — Vendors you order products from.

    JAVA EQUIVALENT (your Supplier.java):
        @Entity @Table(name = "suppliers")
    """

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, default="")
    address = models.TextField(blank=True, default="")
    contact_person = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "suppliers"

    def __str__(self):
        return self.name


class InventoryItem(models.Model):
    """
    InventoryItem entity — Pivot table linking Product to Warehouse with quantity.

    THIS IS THE KEY MODEL. Same product can exist in multiple warehouses.

    JAVA EQUIVALENT (your InventoryItem.java):
        @ManyToOne private Product product;
        @ManyToOne private Warehouse warehouse;
        @UniqueConstraint(columnNames = {"product_id", "warehouse_id"})

    DJANGO DIFFERENCES:
        - ForeignKey = @ManyToOne
        - on_delete=models.CASCADE = cascade delete (if product deleted, inventory deleted)
        - related_name = like @OneToMany(mappedBy = "...") — defines the reverse access
          e.g., product.inventory_items.all() gets all inventory for a product
        - unique_together = @UniqueConstraint
    """

    # ForeignKey = @ManyToOne(fetch = FetchType.LAZY)
    # @JoinColumn(name = "product_id", nullable = false)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,  # Delete inventory if product is deleted
        related_name="inventory_items",  # product.inventory_items.all()
    )

    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name="inventory_items",  # warehouse.inventory_items.all()
    )

    quantity = models.IntegerField(default=0)
    reserved = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "inventory_items"
        # Like @UniqueConstraint(columnNames = {"product_id", "warehouse_id"})
        # Same product can't appear twice in the same warehouse
        constraints = [
            models.UniqueConstraint(
                fields=["product", "warehouse"],
                name="unique_product_warehouse",
            )
        ]

    @property
    def available(self):
        """
        Like your Java method: public Integer getAvailable() { return quantity - reserved; }
        @property makes it accessible as item.available (no parentheses needed)
        """
        return self.quantity - self.reserved

    def __str__(self):
        return f"{self.product.name} @ {self.warehouse.name}: {self.quantity}"


class InventoryMovement(models.Model):
    """
    InventoryMovement entity — Immutable audit trail for all inventory changes.

    JAVA EQUIVALENT (your InventoryMovement.java):
        @ManyToOne private InventoryItem inventoryItem;
        @Enumerated(EnumType.STRING) private MovementType movementType;

    This table is APPEND-ONLY. You never update or delete movements.
    Every stock change (adjust, receive, transfer) creates a new row.
    """

    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="movements",
    )

    movement_type = models.CharField(
        max_length=20,
        choices=MovementType.choices,
    )

    quantity = models.IntegerField()
    quantity_before = models.IntegerField(default=0)
    quantity_after = models.IntegerField(default=0)
    reason = models.CharField(max_length=500, blank=True, default="")
    reference_type = models.CharField(max_length=50, blank=True, default="")
    reference_id = models.CharField(max_length=255, blank=True, default="")

    # In Java you had: @ManyToOne private User performedBy;
    # We use Django's built-in User model (like Spring Security's UserDetails)
    performed_by = models.ForeignKey(
        "auth.User",  # Django's built-in User model
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "inventory_movements"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.movement_type} | {self.inventory_item} | qty: {self.quantity}"
