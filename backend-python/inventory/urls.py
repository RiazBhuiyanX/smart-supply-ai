"""
URL routing for the inventory app.

THIS IS LIKE YOUR @RequestMapping ANNOTATIONS IN SPRING BOOT.

In Java:
    @RestController
    @RequestMapping("/products")     → mapped to ProductController
    @RequestMapping("/warehouses")   → mapped to WarehouseController

In Django, we use a Router that auto-generates URL patterns from ViewSets.
One line per ViewSet = all CRUD routes created automatically.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# DefaultRouter = auto-generates URL patterns for all ViewSets
# Like Spring's @RequestMapping but registered in one place
router = DefaultRouter()

# Each register() call creates all CRUD routes:
#   router.register("products", ...) creates:
#     GET    /products/       → ProductViewSet.list()
#     POST   /products/       → ProductViewSet.create()
#     GET    /products/1/     → ProductViewSet.retrieve()
#     PUT    /products/1/     → ProductViewSet.update()
#     DELETE /products/1/     → ProductViewSet.destroy()
#     (Plus the @action endpoints like /products/1/adjust/)

router.register(r"products", views.ProductViewSet)
router.register(r"warehouses", views.WarehouseViewSet)
router.register(r"suppliers", views.SupplierViewSet)
router.register(r"inventory", views.InventoryItemViewSet)
router.register(r"inventory-movements", views.InventoryMovementViewSet)

# urlpatterns is what Django reads to know all available URLs
urlpatterns = [
    path("", include(router.urls)),
    # AI chat endpoint — manually defined (not a ViewSet, just a function)
    # This matches: POST /api/ai/chat/
    # In Java: @RequestMapping("/api/ai") + @PostMapping("/chat")
    path("ai/chat/", views.ai_chat, name="ai-chat"),
]
