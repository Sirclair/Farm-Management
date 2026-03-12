from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import transaction
from django.core.exceptions import PermissionDenied
from .models import InventoryItem, StockLog 
from .serializers import InventoryItemSerializer
from accounts.models import FarmMembership
from finance.models import Expense
from config.mixins import FarmQuerySetMixin
from decimal import Decimal

class InventoryItemViewSet(FarmQuerySetMixin, viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        farm = self.get_user_farm()
        if not farm:
            raise PermissionDenied("You are not assigned to a farm.")

        try:
            item_name = request.data.get("name", "").strip().lower()
            qty_val = Decimal(str(request.data.get("quantity", 0)))
            price_val = Decimal(str(request.data.get("unit_price", 0)))
            raw_category = request.data.get("category", "feed").lower()
            raw_unit = request.data.get("unit", "KG")

            if qty_val <= 0:
                return Response({"error": "Quantity must be greater than 0."}, status=status.HTTP_400_BAD_REQUEST)

        except (ValueError, TypeError, Decimal.InvalidOperation):
            return Response({"error": "Invalid number format."}, status=status.HTTP_400_BAD_REQUEST)

        added_stock = (qty_val * Decimal('40.0')) if raw_unit.upper() == "BAGS" else qty_val
        total_cost = qty_val * price_val
        category_map = {'feed': 'feed', 'medicine': 'medical', 'equipment': 'utilities'}
        finance_cat = category_map.get(raw_category, 'other')

        try:
            with transaction.atomic():
                item = InventoryItem.objects.filter(name=item_name, farm=farm).first()

                if item:
                    item.quantity += added_stock
                    item.unit_price = price_val 
                    item.save()
                else:
                    item = InventoryItem.objects.create(
                        name=item_name, farm=farm, category=raw_category,
                        quantity=added_stock, unit_price=price_val, unit="KG" 
                    )
                
                StockLog.objects.create(item=item, action='add', quantity_changed=added_stock, unit_price_at_time=price_val)
                Expense.objects.create(farm=farm, amount=total_cost, category=finance_cat, description=f"RESTOCK: {item_name.upper()}")

                serializer = self.get_serializer(item)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"Database save failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)