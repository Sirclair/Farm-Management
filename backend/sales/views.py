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
from accounts.utils import get_user_farm
from accounts.permissions import SalesPermission

from finance.models import Income
from finance.services import (
    get_open_period,
    recalculate_period,
)

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
    permission_classes = [SalesPermission]

    def get_queryset(self):
        farm = get_user_farm(self.request.user)
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
        farm = get_user_farm(request.user)
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

        # 1. Spawn root Order tracking frame instance
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

                # Safe validation using FlockBatch's dynamic stock property
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

            payment = Payment.objects.create(
                order=order,
                amount=amount,
                method=payment_data.get(
                    "method",
                    "cash"
                ),
                reference=payment_data.get(
                    "reference",
                    ""
                ),
            )

            paid += amount

            # ==========================
            # SEND INITIAL SALE PAYMENT
            # TO FINANCE
            # ==========================

            period = get_open_period(
                farm
            )

            Income.objects.create(
                farm=farm,
                period=period,
                amount=amount,
                source=(
                    f"Sale Payment "
                    f"#{order.id}"
                )
            )

        # Explicitly run balance fields compilation metrics inside database records
        order.calculate_totals()

        recalculate_period(
            period
        )

        # 2. FIX: Fetch fresh evaluated query snapshot to populate frontend state correctly
        fresh_order = (
            Order.objects.filter(pk=order.pk)
            .select_related("customer")
            .prefetch_related("items__product", "items__batch", "payments")
            .first()
        )

        return Response(
            OrderSerializer(fresh_order).data,
            status=status.HTTP_201_CREATED
        )


# =========================================================
# PAYMENT VIEWSET
# =========================================================
class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [SalesPermission]

    def get_queryset(self):
        farm = get_user_farm(self.request.user)

        if not farm:
            return Payment.objects.none()

        return (
            Payment.objects
            .filter(order__farm=farm)
        )

    @transaction.atomic
    def perform_create(
        self,
        serializer
    ):
        order = (
            serializer
            .validated_data["order"]
        )

        amount = Decimal(
            str(
                serializer
                .validated_data["amount"]
            )
        )

        if amount > order.balance_due:
            raise ValueError(
                f"Payment exceeds balance of R {order.balance_due}"
            )

        payment = serializer.save()

        # recalculate sales totals
        order.calculate_totals()

        # ==========================
        # SEND TO FINANCE
        # ==========================
        farm = order.farm

        period = get_open_period(
            farm
        )

        Income.objects.create(
            farm=farm,
            period=period,
            amount=amount,
            source=(
                f"Sale Payment "
                f"#{order.id}"
            )
        )

        recalculate_period(
            period
        )

        return payment


# =========================================================
# CUSTOMER VIEWSET
# =========================================================
class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [SalesPermission]

    def get_queryset(self):
        farm = get_user_farm(self.request.user)

        if not farm:
            return Customer.objects.none()

        return Customer.objects.filter(farm=farm)

    def perform_create(self, serializer):
        serializer.save(farm=get_user_farm(self.request.user))


# =========================================================
# SALES ANALYTICS
# =========================================================
@api_view(["GET"])
def sales_analytics(request):
    farm = get_user_farm(request.user)

    if not farm:
        return Response(
            {"error": "No active farm"},
            status=403
        )

    orders = Order.objects.filter(farm=farm)

    totals = orders.aggregate(
        sales_value=Sum("subtotal"),
        collected=Sum("total_paid"),
        outstanding=Sum("balance_due"),
    )

    sales_value = totals["sales_value"] or Decimal("0.00")
    collected = totals["collected"] or Decimal("0.00")
    outstanding = totals["outstanding"] or Decimal("0.00")

    return Response({
        # money actually received
        "total_revenue": collected,

        # optional display
        "gross_sales": sales_value,

        # same as revenue
        "total_paid": collected,

        # unpaid balances
        "debt": outstanding,

        # cash profit for now
        "profit": collected,

        "orders": orders.count(),
    })
    
# =========================================================
# PENDING ORDERS VIEWSET
# =========================================================
class PendingOrderViewSet(viewsets.ModelViewSet):
    serializer_class = PendingOrderSerializer
    permission_classes = [SalesPermission]

    def get_queryset(self):
        farm = get_user_farm(self.request.user)

        if not farm:
            return PendingOrder.objects.none()

        return (
            PendingOrder.objects
            .filter(farm=farm)
            .prefetch_related("items__product", "items__batch")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(farm=get_user_farm(self.request.user))

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
            # Keeps framework clean if cancellation endpoint hooks exist
            pass

    # =====================================================
    # FINAL FULFILLMENT (FIXED)
    # =====================================================
    @transaction.atomic
    def process_final_fulfillment(self, pending_order):

        amount_paid = Decimal(
            str(
                pending_order.deposit_paid or 0
            )
        )

        final_order = Order.objects.create(
            farm=pending_order.farm,
            customer=pending_order.customer,
            notes=(
                f"Generated from Reservation "
                f"{pending_order.order_number}. "
                f"{pending_order.notes or ''}"
            ),
        )

        # ---------------------------------
        # MOVE ITEMS → SALES ORDER
        # ---------------------------------
        for item in pending_order.items.all():

            qty = (
                item.quantity_ordered
                - item.quantity_fulfilled
            )

            if qty <= 0:
                continue

            if item.product:

                if item.product.stock_quantity < qty:
                    raise Exception(
                        f"{item.product.name} insufficient stock"
                    )

                item.product.stock_quantity -= qty
                item.product.save()

            OrderItem.objects.create(
                order=final_order,
                product=item.product,
                batch=item.batch,
                quantity=qty,
                price_per_unit=item.unit_price,
                cost_per_unit=(
                    getattr(
                        item.product,
                        "cost",
                        Decimal("0.00")
                    )
                    if item.product
                    else Decimal("0.00")
                )
            )

            try:
                StockLog.objects.create(
                    item=item.product or item.batch,
                    action="use",
                    quantity=qty,
                    notes=(
                        f"Fulfilled reservation "
                        f"{pending_order.order_number}"
                    )
                )
            except Exception:
                pass

        # ---------------------------------
        # CALCULATE ORDER TOTALS
        # ---------------------------------
        final_order.calculate_totals()

        # ---------------------------------
        # RECORD DEPOSIT AS PAYMENT
        # ---------------------------------
        if amount_paid > 0:

            Payment.objects.create(
                order=final_order,
                amount=amount_paid,
                method="deposit",
                reference=(
                    f"Deposit "
                    f"{pending_order.order_number}"
                )
            )

            final_order.calculate_totals()

        # ---------------------------------
        # FINANCE
        # ---------------------------------
        if amount_paid > 0:

            period = get_open_period(
                pending_order.farm
            )

            Income.objects.create(
                farm=pending_order.farm,
                period=period,
                amount=amount_paid,
                source=(
                    f"Reservation "
                    f"{pending_order.order_number}"
                )
            )

            recalculate_period(period)

        # ---------------------------------
        # CLOSE RESERVATION
        # ---------------------------------
        pending_order.status = "fulfilled"

        # move receivable to sales
        if pending_order.deposit_paid > pending_order.total_amount:
            pending_order.deposit_paid = pending_order.total_amount

        pending_order.save(
            update_fields=[
                "status",
                "deposit_paid",
            ]
        )

        return final_order