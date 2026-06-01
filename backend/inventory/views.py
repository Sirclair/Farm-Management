from decimal import Decimal, InvalidOperation
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from finance.models import Expense
from .models import InventoryItem, StockLog, Supplier, PurchaseOrder, InventoryPurchase
from .serializers import (
    InventoryItemSerializer,
    SupplierSerializer,
    PurchaseOrderSerializer,
    InventoryPurchaseSerializer,
)


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = getattr(self.request.user, "active_farm", None)
        if not farm:
            return InventoryItem.objects.none()
        return InventoryItem.objects.filter(farm=farm)

    def perform_create(self, serializer):
        serializer.save(farm=self.request.user.active_farm)

    @action(detail=False, methods=['post'], url_path='purchase')
    def process_purchase_intake(self, request):
        """
        Processes standard intake logs from the AddStockModal component.
        Maps fields safely and handles calculations atomically.
        """
        farm = getattr(request.user, "active_farm", None)
        if not farm:
            return Response(
                {"error": "No active farm context found in session registration."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        raw_name = request.data.get('name', '').strip()
        raw_category = request.data.get('category', 'feed').strip().lower()
        raw_quantity = request.data.get('quantity', 0)
        raw_unit_price = request.data.get('unit_price', 0)
        raw_unit_of_measure = request.data.get('unit', 'KG')
        raw_min_stock = request.data.get('min_stock_level', 10)
        raw_notes = request.data.get('notes', '')

        if not raw_name:
            return Response({"error": "Item identifier name is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = Decimal(str(raw_quantity))
            unit_price = Decimal(str(raw_unit_price))
            min_stock = Decimal(str(raw_min_stock))
            total_cost = quantity * unit_price
        except Exception:
            return Response({"error": "Invalid decimal formatting numeric strings payload."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                item, created = InventoryItem.objects.get_or_create(
                    farm=farm,
                    category=raw_category,
                    name=raw_name.upper(),
                    defaults={
                        'unit_of_measure': raw_unit_of_measure,
                        'current_level': Decimal('0.00'),
                        'min_stock_level': min_stock,
                        'cost_per_unit': unit_price
                    }
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

                InventoryPurchase.objects.create(
                    farm=farm,
                    inventory_item=item,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_cost=total_cost,
                    notes=raw_notes
                )

                return Response(
                    {
                        "message": "Stockpile registry incremented successfully",
                        "item_name": item.name,
                        "new_balance": float(item.current_level)
                    },
                    status=status.HTTP_201_CREATED
                )

        except Exception as e:
            return Response(
                {"error": f"Database allocation failure aborted transaction: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class SupplierViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Supplier.objects.filter(farm=self.request.user.active_farm)

    def perform_create(self, serializer):
        serializer.save(farm=self.request.user.active_farm)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PurchaseOrder.objects.filter(farm=self.request.user.active_farm)

    def perform_create(self, serializer):
        serializer.save(farm=self.request.user.active_farm)


class InventoryPurchaseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InventoryPurchaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InventoryPurchase.objects.filter(farm=self.request.user.active_farm).order_by("-created_at")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_reorder(request):
    return Response({"message": "Reorder created"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def convert_reorder_to_po(request):
    return Response({"message": "PO created"}, status=status.HTTP_200_OK)