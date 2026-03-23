from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import transaction
from .models import InventoryItem, StockLog 
from finance.models import Expense
from decimal import Decimal

class InventoryItemViewSet(FarmQuerySetMixin, viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer

    def create(self, request, *args, **kwargs):
        farm = self.get_user_farm()
        
        try:
            # Clean and normalize the name to lowercase for consistent matching
            item_name = request.data.get("name", "").strip().lower()
            qty_val = Decimal(str(request.data.get("quantity", 0)))
            price_val = Decimal(str(request.data.get("unit_price", 0)))
            raw_unit = request.data.get("unit", "KG").upper()
            
            # Unit conversion (Bags to KG)
            added_stock = (qty_val * Decimal('40.0')) if raw_unit == "BAGS" else qty_val
            total_cost = qty_val * price_val

            with transaction.atomic():
                # Search for existing item ignoring case
                item = InventoryItem.objects.filter(
                    name__iexact=item_name, 
                    farm=farm
                ).select_for_update().first()

                if item:
                    # Update existing
                    item.quantity += added_stock
                    item.unit_price = price_val 
                    item.save()
                else:
                    # Create new
                    item = InventoryItem.objects.create(
                        name=item_name, 
                        farm=farm, 
                        category=request.data.get("category", "feed"),
                        quantity=added_stock, 
                        unit_price=price_val, 
                        unit="KG"
                    )
                
                # Logs and Expenses for the Dashboard
                StockLog.objects.create(item=item, action='add', quantity_changed=added_stock, unit_price_at_time=price_val)
                Expense.objects.create(farm=farm, amount=total_cost, category='feed', description=f"RESTOCK: {item_name.upper()}")

                return Response(self.get_serializer(item).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Database save failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
