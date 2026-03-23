from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import transaction
from django.core.exceptions import PermissionDenied
from decimal import Decimal

# LOCAL APP IMPORTS
from .models import InventoryItem, StockLog 
from .serializers import InventoryItemSerializer
from finance.models import Expense

# THE MISSING IMPORT CAUSING THE ERROR:
from config.mixins import FarmQuerySetMixin 

class InventoryItemViewSet(FarmQuerySetMixin, viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        farm = self.get_user_farm()
        if not farm:
            raise PermissionDenied("You are not assigned to a farm.")

        try:
            # Normalize data
            item_name = request.data.get("name", "").strip().lower()
            qty_val = Decimal(str(request.data.get("quantity", 0)))
            price_val = Decimal(str(request.data.get("unit_price", 0)))
            raw_category = request.data.get("category", "feed").lower()
            raw_unit = request.data.get("unit", "KG").upper()

            if qty_val <= 0:
                return Response({"error": "Quantity must be greater than 0."}, status=status.HTTP_400_BAD_REQUEST)

            # Bag conversion (assuming 40KG per bag)
            added_stock = (qty_val * Decimal('40.0')) if raw_unit == "BAGS" else qty_val
            total_cost = qty_val * price_val
            
            # Map categories for finance app
            category_map = {'feed': 'feed', 'medicine': 'medical', 'equipment': 'utilities'}
            finance_cat = category_map.get(raw_category, 'other')

            with transaction.atomic():
                # Use select_for_update to handle simultaneous requests safely
                item = InventoryItem.objects.filter(name=item_name, farm=farm).select_for_update().first()

                if item:
                    # Update existing item instead of creating duplicate
                    item.quantity += added_stock
                    item.unit_price = price_val 
                    item.save()
                else:
                    # Create new if it doesn't exist
                    item = InventoryItem.objects.create(
                        name=item_name, 
                        farm=farm, 
                        category=raw_category,
                        quantity=added_stock, 
                        unit_price=price_val, 
                        unit="KG" 
                    )
                
                # Log the stock increase
                StockLog.objects.create(
                    item=item, 
                    action='add', 
                    quantity_changed=added_stock, 
                    unit_price_at_time=price_val
                )

                # Create Expense so your Net Profit on Dashboard updates
                Expense.objects.create(
                    farm=farm, 
                    amount=total_cost, 
                    category=finance_cat, 
                    description=f"RESTOCK: {item_name.upper()}"
                )

                serializer = self.get_serializer(item)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except (ValueError, TypeError, Decimal.InvalidOperation):
            return Response({"error": "Invalid number format."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Internal Server Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
