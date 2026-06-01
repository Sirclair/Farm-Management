from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from flock.models import FlockBatch
from products.models import Product
from inventory.models import StockLog

from .models import (
    Customer,
    Order,
    OrderItem,
    Payment,
    PendingOrder,
    PendingOrderItem,
    PendingOrderFulfillment,
)
from .serializers import (
    CustomerSerializer,
    OrderSerializer,
    PaymentSerializer,
    PendingOrderSerializer,
)

# =========================================================
# ORDER VIEWSET
# =========================================================
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = self.request.user.active_farm
        if not farm:
            return Order.objects.none()

        return (
            Order.objects.filter(farm=farm)
            .select_related("customer")
            .prefetch_related("items__product", "items__batch", "payments")
            .order_by("-created_at")
        )

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        farm = request.user.active_farm
        if not farm:
            return Response({"error": "No active farm"}, status=403)

        items = request.data.get("items", [])
        if not items:
            return Response({"error": "Order requires items"}, status=400)

        customer_name = request.data.get("customer_name")
        customer = None

        if customer_name:
            customer, _ = Customer.objects.get_or_create(
                farm=farm,
                full_name=customer_name,
            )

        order = Order.objects.create(
            farm=farm,
            customer=customer,
        )

        total = Decimal("0.00")

        for item in items:
            quantity = Decimal(str(item.get("quantity", 0)))

            if quantity <= 0:
                return Response({"error": "Invalid quantity"}, status=400)

            # =====================================================
            # LIVE BIRD SALES
            # =====================================================
            if item.get("batch_id") or item.get("batch"):
                batch_id = item.get("batch_id") or item.get("batch")

                batch = FlockBatch.objects.filter(
                    id=batch_id,
                    farm=farm
                ).first()

                if not batch:
                    return Response(
                        {"error": "Invalid flock batch"},
                        status=400
                    )

                if batch.current_stock < quantity:
                    return Response(
                        {"error": f"Only {batch.current_stock} birds available"},
                        status=400,
                    )

                price = Decimal(str(item.get("price_per_unit", 0)))

                order_item = OrderItem.objects.create(
                    order=order,
                    product=None,
                    batch=batch,
                    quantity=quantity,
                    price_per_unit=price,
                    cost_per_unit=Decimal("0.00"),
                )

            # =====================================================
            # PRODUCT SALES
            # =====================================================
            else:
                product_id = item.get("product_id") or item.get("product")

                product = Product.objects.filter(
                    id=product_id,
                    farm=farm
                ).first()

                if not product:
                    return Response(
                        {"error": "Invalid product"},
                        status=400
                    )

                if getattr(product, "product_type", None) == "processed":
                    chickens = Decimal(str(item.get("quantity", 1)))

                    if product.stock_quantity < chickens:
                        return Response(
                            {
                                "error": f"Only {product.stock_quantity} chickens available"
                            },
                            status=400,
                        )

                    product.stock_quantity -= chickens
                    product.save()

                    order_item = OrderItem.objects.create(
                        order=order,
                        product=product,
                        batch=None,
                        quantity=chickens,
                        price_per_unit=Decimal(
                            str(item.get("price_per_unit", product.price))
                        ),
                        cost_per_unit=getattr(
                            product,
                            "cost",
                            Decimal("0.00")
                        ),
                    )

                else:
                    if product.stock_quantity < quantity:
                        return Response(
                            {
                                "error": f"Only {product.stock_quantity} units available"
                            },
                            status=400,
                        )

                    product.stock_quantity -= quantity
                    product.save()

                    order_item = OrderItem.objects.create(
                        order=order,
                        product=product,
                        batch=None,
                        quantity=quantity,
                        price_per_unit=Decimal(
                            str(item.get("price_per_unit", product.price))
                        ),
                        cost_per_unit=getattr(
                            product,
                            "cost",
                            Decimal("0.00")
                        ),
                    )

            total += order_item.total()

        # =====================================================
        # PAYMENTS
        # =====================================================
        paid = Decimal("0.00")

        for payment_data in request.data.get("payments", []):
            amount = Decimal(str(payment_data.get("amount", 0)))

            if amount <= 0:
                continue

            Payment.objects.create(
                order=order,
                amount=amount,
                method=payment_data.get("method", "cash"),
                reference=payment_data.get("reference", ""),
            )

            paid += amount

        order.calculate_totals()

        return Response(
            OrderSerializer(order).data,
            status=201
        )


# =========================================================
# PAYMENT VIEWSET
# =========================================================
class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = self.request.user.active_farm

        if not farm:
            return Payment.objects.none()

        return Payment.objects.filter(order__farm=farm)

    @transaction.atomic
    def perform_create(self, serializer):
        order = serializer.validated_data["order"]
        amount = Decimal(str(serializer.validated_data["amount"]))

        if amount > order.balance_due:
            raise ValueError(
                f"Payment exceeds balance of R {order.balance_due}"
            )

        serializer.save()
        order.calculate_totals()


# =========================================================
# CUSTOMER VIEWSET
# =========================================================
class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = self.request.user.active_farm

        if not farm:
            return Customer.objects.none()

        return Customer.objects.filter(farm=farm)

    def perform_create(self, serializer):
        serializer.save(farm=self.request.user.active_farm)


# =========================================================
# SALES ANALYTICS
# =========================================================
@api_view(["GET"])
def sales_analytics(request):
    farm = request.user.active_farm

    if not farm:
        return Response(
            {"error": "No active farm"},
            status=403
        )

    orders = Order.objects.filter(farm=farm)

    agg = orders.aggregate(
        revenue=Sum("subtotal"),
        paid=Sum("total_paid"),
    )

    revenue = agg["revenue"] or Decimal("0.00")
    paid = agg["paid"] or Decimal("0.00")

    return Response({
        "total_revenue": revenue,
        "total_paid": paid,
        "profit": revenue,
        "debt": revenue - paid,
        "orders": orders.count(),
    })


# =========================================================
# PENDING ORDERS VIEWSET
# =========================================================
class PendingOrderViewSet(viewsets.ModelViewSet):
    serializer_class = PendingOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        farm = self.request.user.active_farm

        if not farm:
            return PendingOrder.objects.none()

        return (
            PendingOrder.objects
            .filter(farm=farm)
            .prefetch_related("items__product", "items__batch")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(farm=self.request.user.active_farm)

    # =====================================================
    # UPDATE (FIXED DEPOSIT LOGIC HERE)
    # =====================================================
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_status = instance.status

        data = request.data.copy()

        # -------------------------------------------------
        # REMOVE DEPOSIT FROM DRF CONTROL
        # -------------------------------------------------
        incoming_deposit = data.pop("deposit_paid", None)

        serializer = self.get_serializer(
            instance,
            data=data,
            partial=kwargs.get("partial", False)
        )

        serializer.is_valid(raise_exception=True)
        updated_order = serializer.save()

        # -------------------------------------------------
        # ACCUMULATE DEPOSIT (REAL FIX)
        # -------------------------------------------------
        if incoming_deposit is not None:
            new_deposit = Decimal(str(incoming_deposit))

            updated_order.deposit_paid = (
                Decimal(str(updated_order.deposit_paid or 0))
                + new_deposit
            )

            # clamp to total
            total = updated_order.total_amount

            if updated_order.deposit_paid > total:
                updated_order.deposit_paid = total

            # update status
            if updated_order.deposit_paid >= total:
                updated_order.status = "fulfilled"
            elif updated_order.deposit_paid > 0:
                updated_order.status = "partial"
            else:
                updated_order.status = "pending"

            updated_order.save()

        # -------------------------------------------------
        # HANDLE STATUS TRANSITIONS
        # -------------------------------------------------
        if old_status != updated_order.status:
            self.handle_status_transition(
                updated_order,
                old_status,
                updated_order.status
            )

        return Response(
            self.get_serializer(updated_order).data
        )

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    # =====================================================
    # STATUS TRANSITIONS
    # =====================================================
    def handle_status_transition(self, order, old_state, new_state):
        if new_state == "fulfilled":
            self.process_final_fulfillment(order)
        elif new_state == "cancelled":
            self.process_cancellation_release(order)

    # =====================================================
    # FINAL FULFILLMENT
    # =====================================================
    def process_final_fulfillment(self, pending_order):
        final_order = Order.objects.create(
            farm=pending_order.farm,
            customer=pending_order.customer,
            subtotal=pending_order.total_amount,
            total_paid=pending_order.deposit_paid,
            payment_status=(
                "paid"
                if pending_order.balance_due <= 0
                else "partial"
            ),
            notes=(
                f"Generated from Reservation "
                f"{pending_order.order_number}. "
                f"{pending_order.notes or ''}"
            )
        )

        for item in pending_order.items.all():
            qty_to_deduct = item.quantity_ordered - item.quantity_fulfilled

            if qty_to_deduct > 0:
                inventory = item.product or item.batch

                if inventory:
                    # ----------------------------
                    # STOCK REDUCTION SAFETY
                    # ----------------------------
                    if hasattr(inventory, "stock_quantity"):
                        inventory.stock_quantity = max(
                            Decimal("0.00"),
                            Decimal(str(inventory.stock_quantity or 0)) - qty_to_deduct
                        )
                    elif hasattr(inventory, "birds_remaining"):
                        inventory.birds_remaining = max(
                            Decimal("0.00"),
                            Decimal(str(inventory.birds_remaining or 0)) - qty_to_deduct
                        )
                    elif hasattr(inventory, "quantity"):
                        inventory.quantity = max(
                            Decimal("0.00"),
                            Decimal(str(inventory.quantity or 0)) - qty_to_deduct
                        )
                    inventory.save()

                # STOCK LOG
                try:
                    StockLog.objects.create(
                        item=inventory,
                        action="use",
                        quantity=qty_to_deduct,
                        notes=f"Fulfilled {pending_order.order_number}"
                    )
                except Exception:
                    pass

            # mark fulfilled
            item.quantity_fulfilled = item.quantity_ordered
            item.save()

            # create final order item
            OrderItem.objects.create(
                order=final_order,
                product=item.product,
                batch=item.batch,
                quantity=item.quantity_ordered,
                price_per_unit=item.unit_price,
                cost_per_unit=getattr(
                    item.product,
                    "cost",
                    Decimal("0.00")
                ) if item.product else Decimal("0.00")
            )

        # create payment record for deposit
        if pending_order.deposit_paid > 0:
            Payment.objects.create(
                order=final_order,
                amount=pending_order.deposit_paid,
                method="cash",
                reference=f"RESERVE-{pending_order.order_number}"
            )

        final_order.calculate_totals()

    # =====================================================
    # CANCEL
    # =====================================================
    def process_cancellation_release(self, pending_order):
        pass

    # =====================================================
    # PARTIAL ITEM FULFILLMENT
    # =====================================================
    @action(detail=True, methods=["post"], url_path="fulfill-item")
    def fulfill_item(self, request, pk=None):
        order = self.get_object()
        item_id = request.data.get("item_id")
        quantity = Decimal(str(request.data.get("quantity", 0)))

        try:
            item = order.items.get(id=item_id)
        except PendingOrderItem.DoesNotExist:
            return Response(
                {"error": "Item not found"},
                status=404
            )

        if quantity <= 0:
            return Response({"error": "Invalid quantity"}, status=400)

        if quantity > item.quantity_remaining:
            return Response({"error": "Exceeds remaining"}, status=400)

        inventory = item.product or item.batch
        available = getattr(
            inventory,
            "stock_quantity",
            getattr(inventory, "birds_remaining", 0)
        )

        if available < quantity:
            return Response({"error": "Insufficient stock"}, status=400)

        with transaction.atomic():
            if hasattr(inventory, "stock_quantity"):
                inventory.stock_quantity -= quantity
            elif hasattr(inventory, "birds_remaining"):
                inventory.birds_remaining -= quantity
            elif hasattr(inventory, "quantity"):
                inventory.quantity -= quantity

            inventory.save()

            item.quantity_fulfilled += quantity
            item.save()

            PendingOrderFulfillment.objects.create(
                pending_order_item=item,
                quantity_delivered=quantity
            )

        return Response(
            self.get_serializer(order).data
        )