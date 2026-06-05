from decimal import Decimal
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    InventoryItem,
    StockLog,
    Supplier,
    PurchaseOrder,
    InventoryPurchase,
)

from .serializers import (
    InventoryItemSerializer,
    SupplierSerializer,
    PurchaseOrderSerializer,
    InventoryPurchaseSerializer,
)


# -------------------------------------------------
# SAFE BASE MIXIN
# -------------------------------------------------
class FarmMixin:
    def get_farm(self):
        return getattr(self.request.user, "active_farm", None)

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return self.queryset.model.objects.none()

        farm = self.get_farm()
        if not farm:
            return self.queryset.model.objects.none()

        return self.queryset.model.objects.filter(farm=farm)


# -------------------------------------------------
# INVENTORY ITEM
# -------------------------------------------------
class InventoryItemViewSet(FarmMixin, viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    queryset = InventoryItem.objects.all()
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(farm=self.get_farm())

    @action(detail=False, methods=["post"])
    def purchase(self, request):
        farm = self.get_farm()
        if not farm:
            return Response({"error": "No farm context"}, status=400)

        name = request.data.get("name", "").strip()
        if not name:
            return Response({"error": "Name required"}, status=400)

        try:
            quantity = Decimal(str(request.data.get("quantity", 0)))
            unit_price = Decimal(str(request.data.get("unit_price", 0)))
            total = quantity * unit_price
        except:
            return Response({"error": "Invalid numbers"}, status=400)

        with transaction.atomic():
            item, _ = InventoryItem.objects.get_or_create(
                farm=farm,
                name=name.upper(),
                defaults={"current_level": 0}
            )

            item.current_level += quantity
            item.cost_per_unit = unit_price
            item.save()

            StockLog.objects.create(
                item=item,
                action="add",
                quantity_changed=quantity,
                unit_price_at_time=unit_price
            )

        return Response({
            "message": "Stock updated",
            "item": item.name,
            "new_level": float(item.current_level)
        })


# -------------------------------------------------
# SUPPLIER
# -------------------------------------------------
class SupplierViewSet(FarmMixin, viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    queryset = Supplier.objects.all()
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(farm=self.get_farm())


# -------------------------------------------------
# PURCHASE ORDER
# -------------------------------------------------
class PurchaseOrderViewSet(FarmMixin, viewsets.ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    queryset = PurchaseOrder.objects.all()
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(farm=self.get_farm())


# -------------------------------------------------
# PURCHASE HISTORY
# -------------------------------------------------
class InventoryPurchaseViewSet(FarmMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = InventoryPurchaseSerializer
    queryset = InventoryPurchase.objects.all()
    permission_classes = [IsAuthenticated]