from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import transaction
from django.core.exceptions import PermissionDenied
from .models import InventoryItem, StockLog 
from .serializers import InventoryItemSerializer
from accounts.models import FarmMembership
from finance.models import Expense
from decimal import Decimal

class InventoryItemViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        membership = FarmMembership.objects.filter(user=user).first()
        if membership:
            return InventoryItem.objects.filter(farm=membership.farm)
        return InventoryItem.objects.none()

    def create(self, request, *args, **kwargs):
        membership = FarmMembership.objects.filter(user=request.user).first()
        if not membership:
            raise PermissionDenied("You are not assigned to a farm.")

        try:
            # 1. Standardize Inputs using Decimal
            item_name = request.data.get("name", "").strip().lower()
            # Wrap inputs in str() before Decimal for maximum safety
            qty_val = Decimal(str(request.data.get("quantity", 0)))
            price_val = Decimal(str(request.data.get("unit_price", 0)))
            raw_category = request.data.get("category", "feed").lower()
            raw_unit = request.data.get("unit", "KG")

            if qty_val <= 0:
                return Response({"error": "Quantity must be greater than 0."}, status=status.HTTP_400_BAD_REQUEST)

        except (ValueError, TypeError, Decimal.InvalidOperation) as e:
            return Response({"error": "Invalid number format for quantity or price."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Setup Conversions (Staying in Decimal)
        added_stock = (qty_val * Decimal('40.0')) if raw_unit.upper() == "BAGS" else qty_val
        total_cost = qty_val * price_val

        category_map = {'feed': 'feed', 'medicine': 'medical', 'equipment': 'utilities'}
        finance_cat = category_map.get(raw_category, 'other')

        try:
            with transaction.atomic():
                # 3. Upsert Logic (Update or Insert)
                item = InventoryItem.objects.filter(name=item_name, farm=membership.farm).first()

                if item:
                    # FIX: item.quantity is a Decimal, added_stock is a Decimal. 
                    # DO NOT USE float()
                    item.quantity += added_stock
                    item.unit_price = price_val 
                    item.save()
                else:
                    item = InventoryItem.objects.create(
                        name=item_name,
                        farm=membership.farm,
                        category=raw_category,
                        quantity=added_stock,
                        unit_price=price_val,
                        unit="KG" 
                    )
                
                # 4. Create Stock Paper Trail
                StockLog.objects.create(
                    item=item,
                    action='add',
                    quantity_changed=added_stock,
                    unit_price_at_time=price_val
                )

                # 5. Auto-Log the Expense to Finance 
                Expense.objects.create(
                    farm=membership.farm,
                    amount=total_cost,
                    category=finance_cat,
                    description=f"RESTOCK: {item_name.upper()} - Added {qty_val} {raw_unit} ({added_stock} KG total)"
                )

                serializer = self.get_serializer(item)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            print(f"DEBUG: Database Error: {e}")
            return Response({"error": f"Database save failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)