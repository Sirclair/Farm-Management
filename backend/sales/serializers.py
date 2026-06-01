from django.db.models import Sum
from rest_framework import serializers
from decimal import Decimal
from .models import (
    Customer,
    Order,
    OrderItem,
    Payment,
    PendingOrder,
    PendingOrderItem,
)

# =========================================================
# CUSTOMER
# =========================================================
class CustomerSerializer(serializers.ModelSerializer):
    total_debt = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "id",
            "full_name",
            "phone",
            "email",
            "address",
            "total_debt",
            "created_at",
        ]
        read_only_fields = ["id", "total_debt", "created_at"]

    def get_total_debt(self, obj):
        agg = Order.objects.filter(customer=obj).aggregate(
            total=Sum("subtotal"),
            paid=Sum("total_paid"),
        )
        total = agg["total"] or Decimal("0.00")
        paid = agg["paid"] or Decimal("0.00")
        return max(Decimal("0.00"), total - paid)


# =========================================================
# ORDER ITEM
# =========================================================
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.name")
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "batch",
            "quantity",
            "price_per_unit",
            "cost_per_unit",
            "line_total",
        ]

    def get_line_total(self, obj):
        return obj.quantity * obj.price_per_unit


# =========================================================
# PAYMENT
# =========================================================
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"


# =========================================================
# ORDER
# =========================================================
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    customer_name = serializers.ReadOnlyField(source="customer.full_name")
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "customer",
            "customer_name",
            "order_number",
            "subtotal",
            "total_paid",
            "balance_due",
            "balance",
            "payment_status",
            "notes",
            "created_at",
            "items",
            "payments",
        ]

    def get_balance(self, obj):
        return max(Decimal("0.00"), obj.subtotal - obj.total_paid)


# =========================================================
# PENDING ORDER ITEM
# =========================================================
class PendingOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.name")
    quantity_remaining = serializers.ReadOnlyField()
    line_total = serializers.ReadOnlyField()

    class Meta:
        model = PendingOrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "batch",
            "quantity_ordered",
            "quantity_fulfilled",
            "quantity_remaining",
            "unit_price",
            "line_total",
        ]


# =========================================================
# PENDING ORDER
# =========================================================
class PendingOrderSerializer(serializers.ModelSerializer):
    items = PendingOrderItemSerializer(many=True, required=False)
    customer_name = serializers.ReadOnlyField(source="customer.full_name")

    total_amount = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = PendingOrder
        fields = [
            "id",
            "farm",
            "customer",
            "customer_name",
            "order_number",
            "status",
            "expected_delivery_date",
            "delivery_time",
            "delivery_address",
            "notes",
            "deposit_paid",
            "total_amount",
            "balance_due",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "farm",
            "order_number",
            "created_at",
            "updated_at",
        ]

    def get_total_amount(self, obj):
        return obj.total_amount

    def get_balance_due(self, obj):
        return obj.balance_due

    def create(self, validated_data):
        """
        Custom handling for nested writable fields layout payload.
        Separates child lines from header transaction variables before committing records.
        """
        # 1. Pop out child items structure safely
        items_data = validated_data.pop("items", [])

        # 2. Create core document tracking row.
        # 'farm' is extracted out of validated_data automatically since your 
        # view passes it directly inside serializer.save(farm=self.request.user.active_farm)
        pending_order = PendingOrder.objects.create(**validated_data)

        # 3. Map, iterate and register tracking data inside child operational ledger tables
        for item_data in items_data:
            PendingOrderItem.objects.create(pending_order=pending_order, **item_data)

        return pending_order