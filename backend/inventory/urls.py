from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    InventoryItemViewSet,
    SupplierViewSet,
    PurchaseOrderViewSet,
    InventoryPurchaseViewSet,
    create_reorder,
    convert_reorder_to_po,
)

router = DefaultRouter()

router.register(
    r"items",
    InventoryItemViewSet,
    basename="inventory-items"
)

router.register(
    r"suppliers",
    SupplierViewSet,
    basename="suppliers"
)

router.register(
    r"purchase-orders",
    PurchaseOrderViewSet,
    basename="purchase-orders"
)

router.register(
    r"purchases",
    InventoryPurchaseViewSet,
    basename="inventory-purchases"
)

urlpatterns = [
    path("", include(router.urls)),

    path("reorder/", create_reorder),

    path(
        "convert-reorder/",
        convert_reorder_to_po
    ),
]