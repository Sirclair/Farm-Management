from decimal import Decimal, InvalidOperation
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.utils import get_user_farm

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
        return get_user_farm(self.request.user)

    def get_queryset(self):
        if (
            getattr(self, "swagger_fake_view", False)
            or not self.request.user.is_authenticated
        ):
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

    # ----------------------------------------------
    # PURCHASE STOCK
    # ----------------------------------------------
    @action(detail=False, methods=["post"])
    def purchase(self, request):

        farm = self.get_farm()

        if not farm:
            return Response(
                {"error": "No farm context"},
                status=400,
            )

        name = request.data.get("name", "").strip()

        if not name:
            return Response(
                {"error": "Name required"},
                status=400,
            )

        supplier_id = request.data.get("supplier_id")
        notes = request.data.get("notes", "")

        try:
            input_quantity = Decimal(
                str(request.data.get("quantity", 0))
            )

            input_unit_price = Decimal(
                str(request.data.get("unit_price", 0))
            )

            if input_quantity <= 0 or input_unit_price <= 0:
                return Response(
                    {
                        "error":
                        "Quantity and unit price must be greater than zero"
                    },
                    status=400,
                )

            total_cost = input_quantity * input_unit_price

            weight_per_pack = Decimal(
                str(request.data.get("weight_per_pack", 1))
            )

            actual_kg_added = input_quantity * weight_per_pack

            actual_price_per_kg = (
                total_cost / actual_kg_added
            )

        except (ValueError, TypeError, InvalidOperation):
            return Response(
                {"error": "Invalid numeric values"},
                status=400,
            )

        with transaction.atomic():

            item, created = (
                InventoryItem.objects.get_or_create(
                    farm=farm,
                    name=name.upper(),
                    defaults={
                        "current_level": Decimal("0.00"),
                        "cost_per_unit": Decimal("0.00"),
                        "unit_of_measure": "KG",
                    },
                )
            )

            old_qty = item.current_level
            old_cost = item.cost_per_unit

            new_qty = old_qty + actual_kg_added

            if old_qty > 0:
                item.cost_per_unit = (
                    (
                        (old_qty * old_cost)
                        + total_cost
                    )
                    / new_qty
                ).quantize(Decimal("0.01"))

            else:
                item.cost_per_unit = (
                    actual_price_per_kg
                ).quantize(Decimal("0.01"))

            item.current_level = new_qty
            item.save()

            StockLog.objects.create(
                item=item,
                action="add",
                quantity_changed=actual_kg_added,
                unit_price_at_time=actual_price_per_kg,
            )

            supplier_obj = None

            if supplier_id:
                supplier_obj = (
                    Supplier.objects.filter(
                        id=supplier_id,
                        farm=farm,
                    ).first()
                )

            InventoryPurchase.objects.create(
                farm=farm,
                supplier=supplier_obj,
                inventory_item=item,
                quantity=actual_kg_added,
                unit_price=actual_price_per_kg,
                total_cost=total_cost,
                notes=notes,
            )

        return Response(
            {
                "message": "Purchase successful"
            },
            status=201,
        )

    # ----------------------------------------------
    # USE STOCK
    # ----------------------------------------------
    @action(
        detail=True,
        methods=["post"],
        url_path="log-usage",
    )
    def log_usage(self, request, pk=None):

        item = self.get_object()

        try:
            quantity = Decimal(
                str(
                    request.data.get(
                        "quantity",
                        0,
                    )
                )
            )

        except InvalidOperation:
            return Response(
                {"error": "Invalid quantity"},
                status=400,
            )

        if quantity <= 0:
            return Response(
                {
                    "error":
                    "Quantity must be greater than zero"
                },
                status=400,
            )

        if quantity > item.current_level:
            return Response(
                {
                    "error":
                    f"Insufficient stock. Available: {item.current_level}"
                },
                status=400,
            )

        with transaction.atomic():

            item.current_level -= quantity

            item.save()

            StockLog.objects.create(
                item=item,
                action="use",
                quantity_changed=quantity,
                unit_price_at_time=item.cost_per_unit,
            )

        return Response(
            {
                "message":
                "Stock usage logged",
                "remaining":
                float(item.current_level),
            }
        )


# -------------------------------------------------
# SUPPLIER
# -------------------------------------------------
class SupplierViewSet(FarmMixin, viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    queryset = Supplier.objects.all()
    permission_classes = [IsAuthenticated]


# -------------------------------------------------
# PURCHASE ORDER
# -------------------------------------------------
class PurchaseOrderViewSet(FarmMixin, viewsets.ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    queryset = PurchaseOrder.objects.all()
    permission_classes = [IsAuthenticated]


# -------------------------------------------------
# PURCHASE HISTORY
# -------------------------------------------------
class InventoryPurchaseViewSet(
    FarmMixin,
    viewsets.ReadOnlyModelViewSet,
):
    serializer_class = InventoryPurchaseSerializer
    queryset = InventoryPurchase.objects.all()
    permission_classes = [IsAuthenticated]