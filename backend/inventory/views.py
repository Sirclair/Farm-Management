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
# SAFE BASE
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

        return self.queryset.model.objects.filter(
            farm=farm
        )


# -------------------------------------------------
# INVENTORY
# -------------------------------------------------
class InventoryItemViewSet(
    FarmMixin,
    viewsets.ModelViewSet,
):

    serializer_class = InventoryItemSerializer
    queryset = InventoryItem.objects.all()

    permission_classes = [
        IsAuthenticated
    ]

    def perform_create(self, serializer):
        serializer.save(
            farm=self.get_farm()
        )

    # ==========================================
    # PURCHASE
    # ==========================================
    @action(
        detail=False,
        methods=["post"],
    )
    def purchase(self, request):

        farm = self.get_farm()

        if not farm:
            return Response(
                {
                    "error":
                    "No farm context"
                },
                status=400,
            )

        try:

            name = (
                request.data
                .get(
                    "name",
                    "",
                )
                .upper()
                .strip()
            )

            if not name:
                raise ValueError()

            purchase_qty = Decimal(
                str(
                    request.data.get(
                        "quantity",
                        0,
                    )
                )
            )

            unit_price = Decimal(
                str(
                    request.data.get(
                        "unit_price",
                        0,
                    )
                )
            )

            conversion_factor = Decimal(
                str(
                    request.data.get(
                        "conversion_factor",
                        1,
                    )
                )
            )

            inventory_unit = (
                request.data.get(
                    "inventory_unit",
                    "KG",
                )
                .upper()
            )

            purchase_unit = (
                request.data.get(
                    "purchase_unit",
                    inventory_unit,
                )
                .upper()
            )

            category = (
                request.data.get(
                    "category",
                    "feed",
                )
            )

            notes = (
                request.data.get(
                    "notes",
                    ""
                )
            )

            supplier_id = (
                request.data.get(
                    "supplier_id"
                )
            )

            if (
                purchase_qty <= 0
                or unit_price <= 0
                or conversion_factor <= 0
            ):
                raise ValueError()

        except (
            ValueError,
            TypeError,
            InvalidOperation,
        ):
            return Response(
                {
                    "error":
                    "Invalid purchase data"
                },
                status=400,
            )

        with transaction.atomic():

            actual_quantity = (
                purchase_qty *
                conversion_factor
            )

            total_cost = (
                purchase_qty *
                unit_price
            )

            cost_per_unit = (
                total_cost /
                actual_quantity
            )

            item, created = (
                InventoryItem.objects.get_or_create(
                    farm=farm,
                    name=name,
                    defaults={
                        "category":
                        category,

                        "inventory_unit":
                        inventory_unit,

                        "purchase_unit":
                        purchase_unit,

                        "conversion_factor":
                        conversion_factor,

                        "current_level":
                        Decimal("0"),

                        "cost_per_unit":
                        Decimal("0"),
                    },
                )
            )

            old_qty = (
                item.current_level
            )

            old_cost = (
                item.cost_per_unit
            )

            new_qty = (
                old_qty +
                actual_quantity
            )

            if old_qty > 0:

                item.cost_per_unit = (
                    (
                        (
                            old_qty *
                            old_cost
                        )
                        +
                        total_cost
                    )
                    /
                    new_qty
                ).quantize(
                    Decimal(
                        "0.01"
                    )
                )

            else:

                item.cost_per_unit = (
                    cost_per_unit
                ).quantize(
                    Decimal(
                        "0.01"
                    )
                )

            item.current_level = (
                new_qty
            )

            item.inventory_unit = (
                inventory_unit
            )

            item.purchase_unit = (
                purchase_unit
            )

            item.conversion_factor = (
                conversion_factor
            )

            item.save()

            StockLog.objects.create(
                item=item,

                action="add",

                quantity_changed=(
                    actual_quantity
                ),

                unit_price_at_time=(
                    item.cost_per_unit
                ),
            )

            supplier = None

            if supplier_id:
                supplier = (
                    Supplier.objects
                    .filter(
                        id=supplier_id,
                        farm=farm,
                    )
                    .first()
                )

            InventoryPurchase.objects.create(
                farm=farm,

                supplier=supplier,

                inventory_item=item,

                quantity=actual_quantity,

                unit_price=item.cost_per_unit,

                total_cost=total_cost,

                notes=notes,
            )

        return Response(
            {
                "message":
                "Inventory recorded",

                "item":
                item.name,

                "stock":
                f"{item.current_level} "
                f"{item.inventory_unit}",
            },
            status=201,
        )

    # ==========================================
    # USE STOCK
    # ==========================================
    @action(
        detail=True,
        methods=["post"],
        url_path="log-usage",
    )
    def log_usage(
        self,
        request,
        pk=None,
    ):

        item = (
            self.get_object()
        )

        try:

            quantity = Decimal(
                str(
                    request.data.get(
                        "quantity",
                        0,
                    )
                )
            )

            if quantity <= 0:
                raise ValueError()

        except (
            ValueError,
            InvalidOperation,
        ):

            return Response(
                {
                    "error":
                    "Invalid quantity"
                },
                status=400,
            )

        if (
            quantity >
            item.current_level
        ):

            return Response(
                {
                    "error":
                    f"Only "
                    f"{item.current_level} "
                    f"{item.inventory_unit} "
                    f"remaining"
                },
                status=400,
            )

        with transaction.atomic():

            item.current_level -= (
                quantity
            )

            item.save()

            StockLog.objects.create(
                item=item,

                action="use",

                quantity_changed=(
                    quantity
                ),

                unit_price_at_time=(
                    item.cost_per_unit
                ),
            )

        return Response(
            {
                "message":
                "Usage recorded",

                "remaining":
                f"{item.current_level} "
                f"{item.inventory_unit}",
            }
        )


# -------------------------------------------------
# SUPPLIER
# -------------------------------------------------
class SupplierViewSet(
    FarmMixin,
    viewsets.ModelViewSet,
):
    serializer_class = (
        SupplierSerializer
    )

    queryset = (
        Supplier.objects.all()
    )

    permission_classes = [
        IsAuthenticated
    ]


# -------------------------------------------------
# PURCHASE ORDER
# -------------------------------------------------
class PurchaseOrderViewSet(
    FarmMixin,
    viewsets.ModelViewSet,
):
    serializer_class = (
        PurchaseOrderSerializer
    )

    queryset = (
        PurchaseOrder.objects.all()
    )

    permission_classes = [
        IsAuthenticated
    ]


# -------------------------------------------------
# PURCHASE HISTORY
# -------------------------------------------------
class InventoryPurchaseViewSet(
    FarmMixin,
    viewsets.ReadOnlyModelViewSet,
):
    serializer_class = (
        InventoryPurchaseSerializer
    )

    queryset = (
        InventoryPurchase.objects.all()
    )

    permission_classes = [
        IsAuthenticated
    ]