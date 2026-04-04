"""
Main URL configuration — like having all @RequestMapping in one file.

In Spring Boot, each controller has its own @RequestMapping.
In Django, you wire them all together here.

/admin/  → Django's built-in admin panel (FREE — no Spring equivalent)
/api/    → All our REST API endpoints (from inventory app)
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django Admin — free CRUD UI for all your models
    # Access at http://localhost:8000/admin/
    path("admin/", admin.site.urls),
    # All API endpoints under /api/ prefix
    # Like your Spring Boot controllers being under /api/
    path("api/", include("inventory.urls")),
]
