from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ProductViewSet,
    InventoryViewSet,
    ProductCategoryViewSet,
)

router = DefaultRouter()

router.register(r"items", ProductViewSet, basename="product")

router.register(
    r"categories",
    ProductCategoryViewSet,
    basename="product-category"
)

router.register(
    r"inventory",
    InventoryViewSet,
    basename="inventory"
)

urlpatterns = [
    path("", include(router.urls)),
]