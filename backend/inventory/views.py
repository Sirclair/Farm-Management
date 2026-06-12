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
            # 1. Capture the raw input quantities from the modal (e.g., 1 bag, R500 per bag)
            input_quantity = Decimal(str(request.data.get("quantity", 0)))
            input_unit_price = Decimal(str(request.data.get("unit_price", 0)))
            
            if input_quantity <= 0 or input_unit_price <= 0:
                return Response({"error": "Quantity and unit price must be greater than zero"}, status=400)
                
            # The exact total money spent out of pocket stays completely absolute
            total_cost = input_quantity * input_unit_price
            
            # 2. Get the physical mass conversion factor (e.g., 25kg or 50kg per bag)
            # Defaults to 1 if you are tracking standalone raw items directly by the KG
            weight_per_pack = Decimal(str(request.data.get("weight_per_pack", 1)))
            
            # 3. Normalize into absolute systemic KG values
            actual_kg_added = input_quantity * weight_per_pack
            actual_price_per_kg = total_cost / actual_kg_added

        except (ValueError, TypeError, InvalidOperation):
            return Response({"error": "Invalid numeric values supplied"}, status=400)

        with transaction.atomic():
            item, created = InventoryItem.objects.get_or_create(
                farm=farm,
                name=name.upper(),
                defaults={
                    "current_level": Decimal("0.00"),
                    "cost_per_unit": Decimal("0.00"),
                    "unit_of_measure": "KG"  # Keeping your underlying metric baseline uniform
                }
            )

            # 4. Compute Weighted Moving Average Cost using baseline KGs
            old_qty = item.current_level
            old_cost = item.cost_per_unit
            new_qty = old_qty + actual_kg_added

            if old_qty > 0:
                # WAC Formula based uniformly on total mass metrics
                calculated_unit_cost = ((old_qty * old_cost) + total_cost) / new_qty
                item.cost_per_unit = calculated_unit_cost.quantize(Decimal("0.01"))
            else:
                # If stock was dead empty, the asset value matches this exact run's real cost per KG
                item.cost_per_unit = actual_price_per_kg.quantize(Decimal("0.01"))

            item.current_level = new_qty
            item.save()

            # 5. Track the actual change context safely in systemic logs
            StockLog.objects.create(
                item=item,
                action="add",
                quantity_changed=actual_kg_added,
                unit_price_at_time=actual_price_per_kg
            )

            supplier_obj = None
            if supplier_id:
                supplier_obj = Supplier.objects.filter(id=supplier_id, farm=farm).first()

            # 6. Keep your comprehensive historical invoice log clean
            InventoryPurchase.objects.create(
                farm=farm,
                supplier=supplier_obj,
                inventory_item=item,
                quantity=actual_kg_added,
                unit_price=actual_price_per_kg,
                total_cost=total_cost,
                notes=f"Logged as {input_quantity} bags at R{input_unit_price}/bag. {notes}".strip()
            )

        return Response({
            "message": "Stock purchase logged and normalized to KG successfully",
            "item": item.name,
            "added_kg": float(actual_kg_added),
            "new_level_kg": float(item.current_level),
            "updated_weighted_cost_per_kg": float(item.cost_per_unit)
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