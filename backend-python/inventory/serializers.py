"""
Serializers — like your DTO (Data Transfer Object) classes in Java.

In Spring Boot you had:
    dto/ProductDTO.java  → controls what JSON the API returns
    dto/AdjustStockRequest.java → controls what JSON the API accepts

In Django REST Framework, Serializers do BOTH:
    - Serialize: Model → JSON (for API responses)
    - Deserialize: JSON → Model (for API requests, with validation)

Think of it as: DTO + validation annotations combined.
"""

from rest_framework import serializers
from .models import Product, Warehouse, Supplier, InventoryItem, InventoryMovement


class ProductSerializer(serializers.ModelSerializer):
    """
    Like your ProductDTO.java — controls which fields appear in JSON.

    JAVA EQUIVALENT:
        public class ProductDTO {
            private String id;
            private String sku;
            private String name;
            ...
        }

    ModelSerializer auto-generates fields from the Model (like Lombok @Data
    generates getters/setters). You just list which fields to include.
    """

    class Meta:
        model = Product  # Which model to serialize
        fields = [  # Which fields to include in JSON
            "id",
            "sku",
            "name",
            "category",
            "price",
            "safety_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        # read_only = can't be set via API (auto-generated)


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ["id", "name", "location", "type", "capacity"]
        read_only_fields = ["id"]


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "address",
            "contact_person",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class InventoryItemSerializer(serializers.ModelSerializer):
    """
    Includes nested product and warehouse info in the response.

    JAVA EQUIVALENT:
        In your Java DTOs, you probably returned product_id and warehouse_id.
        Here we return the FULL product and warehouse objects (nested).
        This is like using @ManyToOne with FetchType.EAGER in the DTO.
    """

    # These make the API return full objects instead of just IDs
    # source="product" tells DRF to serialize the related Product object
    product = ProductSerializer(read_only=True)
    warehouse = WarehouseSerializer(read_only=True)

    # These accept IDs when creating (POST request body has product_id, warehouse_id)
    # write_only=True means they appear in input JSON but NOT in output JSON
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source="product",
        write_only=True,
    )
    warehouse_id = serializers.PrimaryKeyRelatedField(
        queryset=Warehouse.objects.all(),
        source="warehouse",
        write_only=True,
    )

    # 'available' is a @property on the model, not a DB field
    # SerializerMethodField calls get_available() to compute it
    available = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "product",
            "warehouse",
            "product_id",
            "warehouse_id",
            "quantity",
            "reserved",
            "available",
            "last_updated",
        ]
        read_only_fields = ["id", "last_updated", "available"]

    def get_available(self, obj):
        """Called by SerializerMethodField — returns obj.available (@property)"""
        return obj.available


class InventoryMovementSerializer(serializers.ModelSerializer):
    """Read-only serializer for the audit trail."""

    inventory_item = InventoryItemSerializer(read_only=True)

    class Meta:
        model = InventoryMovement
        fields = [
            "id",
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
        read_only_fields = fields  # ALL fields are read-only (append-only table)


class StockAdjustmentSerializer(serializers.Serializer):
    """
    Like your AdjustStockRequest.java DTO.

    This is NOT a ModelSerializer — it doesn't map to a model.
    It's a plain Serializer that just validates input.

    JAVA EQUIVALENT:
        public class AdjustStockRequest {
            @NotNull private Integer newQuantity;
            @NotBlank private String reason;
        }
    """

    new_quantity = serializers.IntegerField(min_value=0)  # Like @Min(0)
    reason = serializers.CharField(max_length=500)  # Like @NotBlank @Size(max=500)
