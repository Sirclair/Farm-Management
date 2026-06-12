from decimal import Decimal, InvalidOperation
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
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

        supplier_id = request.data.get("supplier_id")
        notes = request.data.get("notes", "")

        try:
            quantity = Decimal(str(request.data.get("quantity", 0)))
            unit_price = Decimal(str(request.data.get("unit_price", 0)))
            
            if quantity <= 0 or unit_price <= 0:
                return Response({"error": "Quantity and unit price must be greater than zero"}, status=400)
                
            total_cost = quantity * unit_price
        except (ValueError, TypeError, InvalidOperation):
            return Response({"error": "Invalid numeric values supplied"}, status=400)

        with transaction.atomic():
            # 1. Fetch or create the inventory stock profile
            item, created = InventoryItem.objects.get_or_create(
                farm=farm,
                name=name.upper(),
                defaults={
                    "current_level": Decimal("0.00"),
                    "cost_per_unit": Decimal("0.00")
                }
            )

            # 2. Compute Weighted Moving Average Cost before updating current stock levels
            old_qty = item.current_level
            old_cost = item.cost_per_unit
            new_qty = old_qty + quantity

            if old_qty > 0:
                # WAC Formula: ((Old Qty * Old Cost) + (New Qty * New Cost)) / Total Qty
                calculated_unit_cost = ((old_qty * old_cost) + total_cost) / new_qty
                item.cost_per_unit = calculated_unit_cost.quantize(Decimal("0.01"))
            else:
                # If stock was completely flat or first time entry, use current unit price
                item.cost_per_unit = unit_price

            item.current_level = new_qty
            item.save()

            # 3. Create tracking verification log
            StockLog.objects.create(
                item=item,
                action="add",
                quantity_changed=quantity,
                unit_price_at_time=unit_price
            )

            # 4. Correctly commit entry into historical InventoryPurchase ledger
            supplier_obj = None
            if supplier_id:
                supplier_obj = Supplier.objects.filter(id=supplier_id, farm=farm).first()

            InventoryPurchase.objects.create(
                farm=farm,
                supplier=supplier_obj,
                inventory_item=item,
                quantity=quantity,
                unit_price=unit_price,
                total_cost=total_cost,
                notes=notes
            )

        return Response({
            "message": "Stock purchase logged and financial ledger updated successfully",
            "item": item.name,
            "new_level": float(item.current_level),
            "updated_weighted_cost": float(item.cost_per_unit)
        }, status=status.HTTP_201_CREATED)


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