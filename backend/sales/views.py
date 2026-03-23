from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from django.db import transaction
from .models import Order, OrderItem, Customer
from .serializers import OrderSerializer
from flock.models import FlockBatch
from accounts.models import FarmMembership
from config.mixins import FarmQuerySetMixin

# ... your existing imports ...

class OrderViewSet(FarmQuerySetMixin, viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        batch_id = request.data.get("batch_id")
        quantity = int(request.data.get("quantity", 0))
        customer_name = request.data.get("customer_name", "Walk-in")
        payment_method = request.data.get("payment_method", "cash")
        price_per_unit = float(request.data.get("price_per_unit", 0))
        farm = self.get_user_farm()

        if not batch_id or quantity <= 0:
            return Response({"error": "Valid batch and quantity required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Use select_for_update() to prevent two sales from hitting the same batch simultaneously
                batch = FlockBatch.objects.select_for_update().get(id=batch_id)
                
                if batch.farm != farm:
                    return Response({"error": "Unauthorized batch access"}, status=status.HTTP_403_FORBIDDEN)

                # --- CRITICAL STOCK CHECK ---
                if batch.current_stock < quantity:
                    return Response({
                        "error": f"Insufficient stock. Only {batch.current_stock} birds available."
                    }, status=status.HTTP_400_BAD_REQUEST)

                customer, _ = Customer.objects.get_or_create(full_name=customer_name, farm=farm)

                # 1. Create the Order
                order = Order.objects.create(
                    farm=farm, 
                    manual_customer=customer, 
                    payment_method=payment_method,
                    total_amount=quantity * price_per_unit,
                    status="completed"
                )

                # 2. Create the Order Item
                OrderItem.objects.create(
                    order=order, 
                    batch=batch, 
                    quantity=quantity,
                    price_at_sale=price_per_unit
                )

                # 3. --- DEDUCT STOCK PHYSICALLY ---
                batch.current_stock -= quantity
                batch.save()

                return Response({
                    "message": "Sale completed and stock updated", 
                    "order_id": order.id,
                    "new_stock": batch.current_stock
                }, status=status.HTTP_201_CREATED)
                
        except FlockBatch.DoesNotExist:
            return Response({"error": "Batch not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
