"""
Views — like your Controller classes in Spring Boot.

In Spring Boot you had:
    @RestController
    @RequestMapping("/products")
    public class ProductController { ... }

In Django REST Framework, ViewSets combine all CRUD operations in one class:
    - list()   = GET /products/         (like your getAllProducts())
    - create() = POST /products/        (like your createProduct())
    - retrieve() = GET /products/1/     (like your getProductById())
    - update() = PUT /products/1/       (like your updateProduct())
    - destroy() = DELETE /products/1/   (like your deleteProduct())

ModelViewSet gives you ALL of these for free — zero boilerplate.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db import transaction

from .models import (
    Product,
    Warehouse,
    Supplier,
    InventoryItem,
    InventoryMovement,
    MovementType,
)
from .serializers import (
    ProductSerializer,
    WarehouseSerializer,
    SupplierSerializer,
    InventoryItemSerializer,
    InventoryMovementSerializer,
    StockAdjustmentSerializer,
)


class ProductViewSet(viewsets.ModelViewSet):
    """
    CRUD for Products.

    JAVA EQUIVALENT (your ProductController.java):
        @RestController @RequestMapping("/products")
        @GetMapping → list()
        @PostMapping → create()
        @GetMapping("/{id}") → retrieve()
        @PutMapping("/{id}") → update()
        @DeleteMapping("/{id}") → destroy()

    ModelViewSet does ALL of this automatically. You just set:
        - queryset = which objects to serve (like repository.findAll())
        - serializer_class = which DTO to use
    """

    # Like: return productRepository.findAll();
    queryset = Product.objects.all()

    # Like: which DTO class to use for serialization
    serializer_class = ProductSerializer

    def get_queryset(self):
        """
        Override to add search functionality.
        Like: @RequestParam(required=false) String search
        """
        queryset = Product.objects.all()
        search = self.request.query_params.get("search")
        if search:
            # Like: WHERE name ILIKE '%search%' OR sku ILIKE '%search%'
            # __icontains = case-insensitive LIKE in Django ORM
            queryset = queryset.filter(name__icontains=search) | queryset.filter(
                sku__icontains=search
            )
        return queryset


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer


class InventoryItemViewSet(viewsets.ModelViewSet):
    """
    CRUD for Inventory Items + stock adjustment.

    The adjust_stock action is the most important business logic — it's where
    your Java InventoryItemService.adjustQuantity() is replicated.
    """

    queryset = InventoryItem.objects.select_related("product", "warehouse").all()
    serializer_class = InventoryItemSerializer

    def get_queryset(self):
        queryset = InventoryItem.objects.select_related("product", "warehouse").all()

        # Filter by warehouse (like @RequestParam warehouseId)
        warehouse_id = self.request.query_params.get("warehouse")
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)

        # Search by product name
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(product__name__icontains=search)

        return queryset

    @action(detail=True, methods=["post"], url_path="adjust")
    @transaction.atomic  # Like @Transactional in Spring
    def adjust_stock(self, request, pk=None):
        """
        POST /inventory/{id}/adjust/
        Body: { "new_quantity": 100, "reason": "Quarterly inventory count" }

        THIS IS YOUR JAVA adjustQuantity() METHOD REWRITTEN IN PYTHON.

        JAVA EQUIVALENT (InventoryItemService.java):
            public InventoryItemResponse adjustQuantity(String id, int newQuantity, String reason) {
                InventoryItem item = inventoryItemRepository.findById(id).orElseThrow(...);
                if (newQuantity < 0) throw new RuntimeException("Cannot have negative quantity");
                int oldQuantity = item.getQuantity();
                int adjustment = newQuantity - oldQuantity;
                InventoryMovement movement = InventoryMovement.builder()
                    .inventoryItem(item)
                    .movementType(adjustment >= 0 ? MovementType.IN : MovementType.OUT)
                    .quantity(Math.abs(adjustment))
                    .quantityBefore(oldQuantity)
                    .quantityAfter(newQuantity)
                    .reason(reason)
                    .referenceType("MANUAL_ADJUSTMENT")
                    .build();
                inventoryMovementRepository.save(movement);
                item.setQuantity(newQuantity);
                item = inventoryItemRepository.save(item);
                return toResponse(item);
            }
        """

        # Step 1: Validate the request body (like @Valid @RequestBody)
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_quantity = serializer.validated_data["new_quantity"]
        reason = serializer.validated_data["reason"]

        # Step 2: Find the inventory item (like repository.findById().orElseThrow())
        item = self.get_object()  # Returns 404 if not found (like orElseThrow)

        # Step 3: Calculate the adjustment
        old_quantity = item.quantity
        adjustment = new_quantity - old_quantity

        # Step 4: Determine movement type (same logic as Java)
        # adjustment >= 0 ? MovementType.IN : MovementType.OUT
        movement_type = MovementType.IN if adjustment >= 0 else MovementType.OUT

        # Step 5: Create audit trail entry (like inventoryMovementRepository.save())
        InventoryMovement.objects.create(
            inventory_item=item,
            movement_type=movement_type,
            quantity=abs(adjustment),
            quantity_before=old_quantity,
            quantity_after=new_quantity,
            reason=reason,
            reference_type="MANUAL_ADJUSTMENT",
        )

        # Step 6: Update the inventory item (like item.setQuantity() + save())
        item.quantity = new_quantity
        item.save()

        # Step 7: Return the updated item (like return toResponse(item))
        return Response(
            InventoryItemSerializer(item).data,
            status=status.HTTP_200_OK,
        )


class InventoryMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for inventory movements (audit trail).

    ReadOnlyModelViewSet = only list() and retrieve(), no create/update/delete.
    Because movements are APPEND-ONLY — created by adjust_stock, never manually.

    JAVA EQUIVALENT:
        @GetMapping → getAllMovements()
        @GetMapping("/{id}") → getMovementById()
        (No POST, PUT, DELETE endpoints)
    """

    queryset = InventoryMovement.objects.select_related(
        "inventory_item__product",
        "inventory_item__warehouse",
    ).all()
    serializer_class = InventoryMovementSerializer


# ============================================================
# AI CHAT ENDPOINT — Like your AiController.java
# ============================================================


@api_view(["POST"])
def ai_chat(request):
    """
    POST /api/ai/chat/
    Body: { "message": "Which products are low on stock?" }
    Response: { "response": "Based on the inventory data..." }

    JAVA EQUIVALENT (AiController.java):
        @RestController
        @RequestMapping("/api/ai")
        public class AiController {
            @PostMapping("/chat")
            public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
                String response = aiService.generateResponse(request.getMessage());
                return ResponseEntity.ok(new AiChatResponse(response));
            }
        }

    PYTHON DIFFERENCES:
        - @api_view(["POST"]) = @PostMapping — a function-based view (not a class)
        - request.data = @RequestBody — Django REST auto-parses JSON
        - Response({...}) = ResponseEntity.ok(new AiChatResponse(...))
        - No DTO classes needed — Python dicts ARE the response
    """
    # Get the message from request body
    # Java: request.getMessage()  (from AiChatRequest DTO)
    # Python: request.data.get("message")  (from parsed JSON dict)
    message = request.data.get("message", "").strip()

    if not message:
        return Response(
            {"error": "Message cannot be empty"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Call the AI service (same as Java: aiService.generateResponse(message))
    from .ai_service import generate_response

    ai_response = generate_response(message)

    # Return response (same structure as AiChatResponse DTO)
    return Response({"response": ai_response})
