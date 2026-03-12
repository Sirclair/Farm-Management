from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from django.db import transaction
from .models import Order, OrderItem, Customer
from .serializers import OrderSerializer
from flock.models import FlockBatch
from accounts.models import FarmMembership

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            farm__memberships__user=self.request.user
        ).order_by("-created_at")

    def get_user_farm(self):
        membership = FarmMembership.objects.filter(
            user=self.request.user
        ).select_related("farm").first()
        return membership.farm if membership else None

    def create(self, request, *args, **kwargs):
        batch_id = request.data.get("batch_id")
        quantity = request.data.get("quantity")
        customer_name = request.data.get("customer_name", "Walk-in")
        payment_method = request.data.get("payment_method", "cash")
        price_per_unit = request.data.get("price_per_unit")

        if not batch_id or not quantity:
            return Response(
                {"error": "Batch and quantity required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                batch = FlockBatch.objects.get(id=batch_id)
                farm = self.get_user_farm()

                if batch.farm != farm:
                    return Response(
                        {"error": "Unauthorized batch access"},
                        status=status.HTTP_403_FORBIDDEN
                    )

                # 1. Handle Customer
                customer, _ = Customer.objects.get_or_create(
                    full_name=customer_name,
                    farm=farm
                )

                # 2. Create Order
                order = Order.objects.create(
                    farm=farm,
                    manual_customer=customer,
                    payment_method=payment_method,
                    # We can let update_total handle the amount, or set it here
                    total_amount=float(quantity) * float(price_per_unit) if price_per_unit else 0,
                    status="completed"
                )

                # 3. Create OrderItem 
                # THIS LINE triggers OrderItem.save(), which handles the stock deduction
                OrderItem.objects.create(
                    order=order,
                    batch=batch,
                    quantity=int(quantity),
                    price_at_sale=float(price_per_unit) if price_per_unit else 0
                )

                return Response(
                    {"message": "Sale completed", "order_id": order.id},
                    status=status.HTTP_201_CREATED
                )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)